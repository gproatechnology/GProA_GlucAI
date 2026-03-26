"""
GECRAI 1.2 - Users Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging

from app.db.session import get_db
from app.core.security import get_current_user
from app.core.audit import log_action
from app.core.features import get_current_org_features
from app.models.user import User, UserRole
from app.schemas.user import UserUpdate, UserResponse
from app.schemas.common import PaginatedResponse
from fastapi import Request

router = APIRouter()
logger = logging.getLogger(__name__)




@router.get("", response_model=PaginatedResponse[UserResponse])
async def list_users(
    page: int = 1,
    page_size: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List users in the organization"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    # Get users in same organization
    skip = (page - 1) * page_size
    result = await db.execute(
        select(User)
        .where(User.org_id == current_user.org_id)
        .offset(skip)
        .limit(page_size)
    )
    users = result.scalars().all()

    # Get total count
    from sqlalchemy import func
    count_result = await db.execute(
        select(func.count(User.id)).where(User.org_id == current_user.org_id)
    )
    total = count_result.scalar()

    # Pagination logic
    total_pages = (total + page_size - 1) // page_size
    
    return PaginatedResponse(
        items=users,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1
    )


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user)
):
    """Get current user information"""
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role.value,
        is_active=current_user.is_active,
        organization_id=str(current_user.org_id),
    )


@router.get("/me/features")
async def get_my_features(
    features: dict = Depends(get_current_org_features)
):
    """
    Return the feature flags for the current user's organization plan.
    Frontend uses this to conditionally show/hide premium UI elements.
    """
    return {"features": features}


@router.patch("/me", response_model=UserResponse)
async def update_me(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update current user profile"""
    if update_data.full_name is not None:
        current_user.full_name = update_data.full_name
    if update_data.avatar_url is not None:
        current_user.avatar_url = update_data.avatar_url

    await db.flush()

    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role.value,
        is_active=current_user.is_active,
        organization_id=str(current_user.org_id),
    )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user by ID"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Only allow viewing users in same organization
    if user.org_id != current_user.org_id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )

    return UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role.value,
        is_active=user.is_active,
        organization_id=str(user.org_id),
    )


@router.patch("/{user_id}/suspend", response_model=UserResponse)
async def suspend_user(
    user_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Admin: Suspend (deactivate) a user account."""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can suspend users"
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Org boundary check
    if user.org_id != current_user.org_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Prevent self-suspension
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot suspend your own account"
        )

    user.is_active = False
    await log_action(
        db, action="USER_SUSPEND", user_id=current_user.id,
        resource_type="user", resource_id=str(user.id),
        details={"suspended_email": user.email}, request=request
    )
    await db.commit()
    logger.info(f"User {user.email} suspended by {current_user.email}")

    return UserResponse(
        id=str(user.id), email=user.email, full_name=user.full_name,
        role=user.role.value, is_active=user.is_active,
        organization_id=str(user.org_id),
    )


@router.patch("/{user_id}/activate", response_model=UserResponse)
async def activate_user(
    user_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Admin: Reactivate a suspended user account."""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can activate users"
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user.org_id != current_user.org_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    user.is_active = True
    await log_action(
        db, action="USER_ACTIVATE", user_id=current_user.id,
        resource_type="user", resource_id=str(user.id),
        details={"activated_email": user.email}, request=request
    )
    await db.commit()
    logger.info(f"User {user.email} activated by {current_user.email}")

    return UserResponse(
        id=str(user.id), email=user.email, full_name=user.full_name,
        role=user.role.value, is_active=user.is_active,
        organization_id=str(user.org_id),
    )
