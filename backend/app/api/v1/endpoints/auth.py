"""
GECRAI 1.2 - Authentication Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
from typing import Optional
import logging
import uuid

from app.db.session import get_db
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    get_token_jti,
    get_current_user,
)
from app.core.audit import log_action
from app.core.token_blacklist import TokenBlacklist, token_blacklist
from app.core.rate_limit import limiter, RateLimitConfig
from app.models.user import User, UserRole
from app.models.organization import Organization, PlanType
from app.models.refresh_token import RefreshToken
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    Token,
    UserResponse,
    LoginResponse,
)
from app.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


async def _create_refresh_token_record(
    db: AsyncSession,
    user_id: uuid.UUID,
    token: str,
    jti: uuid.UUID,
    expires_at: datetime
) -> RefreshToken:
    """
    Create a refresh token record in the database.
    
    Args:
        db: Database session
        user_id: User ID
        token: The JWT refresh token string
        jti: The unique JWT ID
        expires_at: Token expiration time
        
    Returns:
        Created RefreshToken record
    """
    refresh_token = RefreshToken(
        jti=jti,
        user_id=user_id,
        token=token,
        expires_at=expires_at,
        revoked=False,
    )
    db.add(refresh_token)
    await db.flush()
    return refresh_token


async def _revoke_refresh_token(
    db: AsyncSession,
    jti: uuid.UUID,
    expires_at: datetime
) -> bool:
    """
    Revoke a refresh token by marking it as revoked in DB
    and adding to Redis blacklist.
    
    Args:
        db: Database session
        jti: Token JTI to revoke
        expires_at: Token expiration time
        
    Returns:
        True if successfully revoked
    """
    try:
        # Find and revoke in database
        result = await db.execute(
            select(RefreshToken).where(RefreshToken.jti == jti)
        )
        token_record = result.scalar_one_or_none()
        
        if token_record and not token_record.revoked:
            token_record.revoked = True
            token_record.revoked_at = datetime.utcnow()
            await db.flush()
        
        # Add to Redis blacklist
        token_blacklist.revoke_token(jti, expires_at)
        
        return True
        
    except Exception as e:
        logger.error(f"Error revoking token: {e}")
        return False


@router.post("/register", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit(RateLimitConfig.REGISTER_IP)
async def register(
    request: Request,
    response: Response,
    user_data: UserRegister,
    db: AsyncSession = Depends(get_db)
):
    """Register a new user and create organization"""

    # Check if email already exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalar_one_or_none()
    
    # Use generic message to prevent user enumeration
    if existing_user:
        # Even if user exists, return success with generic message
        # This prevents attackers from knowing which emails are registered
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration failed. Please try again or contact support."
        )

    # Generate URL-safe slug from organization name using python-slugify
    org_slug = user_data.get_org_slug()
    
    # Ensure slug is not empty after sanitization
    if not org_slug:
        org_slug = f"org-{uuid.uuid4().hex[:8]}"

    # Check if org slug exists
    result = await db.execute(select(Organization).where(Organization.slug == org_slug))
    if result.scalar_one_or_none():
        # Add random suffix to ensure uniqueness
        org_slug = f"{org_slug}-{uuid.uuid4().hex[:8]}"

    organization = Organization(
        name=user_data.organization_name,
        slug=org_slug,
        plan=PlanType.FREE,
    )
    db.add(organization)
    await db.flush()

    # Create user
    user = User(
        org_id=organization.id,
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        role=UserRole.OWNER,  # First user is owner
        is_verified=False,
    )
    db.add(user)
    await db.flush()

    # Audit Log
    await log_action(
        db, 
        action="USER_REGISTER", 
        user_id=user.id, 
        resource_type="user", 
        resource_id=str(user.id),
        details={"email": user.email, "org": organization.name},
        request=request
    )

    # Generate tokens with JTI
    from datetime import timedelta
    access_token = create_access_token(subject=str(user.id))
    refresh_token_str, jti = create_refresh_token(subject=str(user.id))
    
    # Calculate expiration
    from app.config import settings
    expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    # Store refresh token in database
    await _create_refresh_token_record(
        db, user.id, refresh_token_str, jti, expires_at
    )

    logger.info(f"New user registered: {user.email}")

    # Set refresh token in HttpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token_str,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
    )

    return LoginResponse(
        access_token=access_token,
        refresh_token=None,  # No longer in body
        user=UserResponse(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            role=user.role.value if hasattr(user.role, 'value') else user.role,
            organization_id=str(organization.id),
        )
    )


@router.post("/login", response_model=LoginResponse)
@limiter.limit(RateLimitConfig.LOGIN_IP)
async def login(
    request: Request,
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """Login with email and password"""

    # Find user by email
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled"
        )

    # Update last login
    user.last_login_at = datetime.utcnow()
    await db.flush()

    # Generate tokens with JTI
    access_token = create_access_token(subject=str(user.id))
    refresh_token_str, jti = create_refresh_token(subject=str(user.id))
    
    # Calculate expiration
    from app.config import settings
    from datetime import timedelta
    expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    # Store refresh token in database
    await _create_refresh_token_record(
        db, user.id, refresh_token_str, jti, expires_at
    )

    logger.info(f"User logged in: {user.email}")

    # Audit Log
    await log_action(
        db, 
        action="USER_LOGIN", 
        user_id=user.id, 
        request=request
    )

    # Set refresh token in HttpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token_str,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
    )

    return LoginResponse(
        access_token=access_token,
        refresh_token=None,  # No longer in body
        user=UserResponse(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            role=user.role.value if hasattr(user.role, 'value') else user.role,
            organization_id=str(user.org_id),
        )
    )


@router.post("/refresh", response_model=Token)
@limiter.limit(RateLimitConfig.REFRESH_IP)
async def refresh_token(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """
    Refresh access token using refresh token with rotation.
    
    This endpoint:
    1. Validates the refresh token
    2. Checks if token is blacklisted in Redis
    3. Verifies token exists in database and is not revoked
    4. Revokes the old token (marks as revoked + adds to blacklist)
    5. Creates a new refresh token with new JTI
    6. Stores new token in database
    7. Returns new access and refresh tokens
    """
    # Get refresh token from cookie
    refresh_token = request.cookies.get("refresh_token")
    
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing refresh token cookie",
        )

    # Decode and validate refresh token
    payload = decode_refresh_token(refresh_token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Extract JTI
    jti = get_token_jti(payload)
    if not jti:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing JTI"
        )
    
    user_id = payload.get("sub")
    exp = payload.get("exp")
    
    if not user_id or not exp:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing claims"
        )
    
    # Check if token is blacklisted in Redis
    if token_blacklist.is_blacklisted(jti):
        logger.warning(f"Attempted to use blacklisted token: {jti}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked"
        )
    
    # Check if token exists in database and is not revoked
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.jti == jti,
            RefreshToken.user_id == user_id
        )
    )
    token_record = result.scalar_one_or_none()
    
    if not token_record:
        # Token not found in DB - might be from old version or invalid
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    if token_record.revoked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked"
        )
    
    if token_record.is_expired:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired"
        )
    
    # Get the expiration from the token for blacklist
    expires_at = datetime.utcfromtimestamp(exp)
    
    # Revoke the old token
    await _revoke_refresh_token(db, jti, expires_at)
    
    # Find user
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    # Generate new tokens
    access_token = create_access_token(subject=str(user.id))
    new_refresh_token_str, new_jti = create_refresh_token(subject=str(user.id))
    
    # Calculate new expiration
    from app.config import settings
    from datetime import timedelta
    new_expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    # Store new refresh token in database
    await _create_refresh_token_record(
        db, user.id, new_refresh_token_str, new_jti, new_expires_at
    )
    
    logger.info(f"Token rotated for user: {user.email}")

    # Set new refresh token in HttpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token_str,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
    )

    return Token(
        access_token=access_token,
        refresh_token=None,
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user information"""
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role.value,
        organization_id=str(current_user.org_id),
    )


@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Logout user and revoke all refresh tokens"""
    try:
        # Revoke all refresh tokens for this user
        result = await db.execute(
            select(RefreshToken).where(
                RefreshToken.user_id == current_user.id,
                RefreshToken.revoked == False
            )
        )
        tokens = result.scalars().all()
        
        for token in tokens:
            token.revoked = True
            token.revoked_at = datetime.utcnow()
            # Add refresh token to blacklist
            token_blacklist.revoke_token(token.jti, token.expires_at)
        
        # Revoke current access token
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            access_token = auth_header.split(" ")[1]
            from app.core.security import decode_token
            payload = decode_token(access_token)
            if payload:
                jti = get_token_jti(payload)
                exp = payload.get("exp")
                if jti and exp:
                    expires_at = datetime.utcfromtimestamp(exp)
                    token_blacklist.revoke_token(jti, expires_at)
        
        await db.flush()
        
    except Exception as e:
        logger.error(f"Error during logout: {e}")
    
    # Audit Log
    await log_action(
        db, 
        action="USER_LOGOUT", 
        user_id=current_user.id, 
        request=request
    )

    # Clear cookie
    response.delete_cookie(
        key="refresh_token",
        secure=settings.ENVIRONMENT == "production",
        samesite="lax"
    )
    
    return {"message": "Successfully logged out"}
