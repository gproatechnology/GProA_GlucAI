"""
GECRAI 1.2 - Authentication Schemas
Pydantic v2 schemas for authentication
"""
import re
from slugify import slugify
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional


class UserRegister(BaseModel):
    """User registration schema with password validation."""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: Optional[str] = Field(None, max_length=255)
    organization_name: str = Field(..., min_length=2, max_length=255)

    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """
        Validate password meets security requirements.
        Uses single generic error message (no specific rule disclosure).
        """
        # Normalize: strip whitespace
        v = v.strip()

        # Check all requirements
        has_upper = re.search(r'[A-Z]', v) is not None
        has_lower = re.search(r'[a-z]', v) is not None
        has_digit = re.search(r'\d', v) is not None
        # Special chars: anything that's not word char or whitespace
        has_special = re.search(r'[^\w\s]', v) is not None

        # Single validation - all must pass
        if not all([has_upper, has_lower, has_digit, has_special]):
            raise ValueError("Password does not meet security requirements")

        return v

    @field_validator('organization_name')
    @classmethod
    def validate_org_name(cls, v: str) -> str:
        """Validate and sanitize organization name."""
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Organization name must be at least 2 characters")
        if len(v) > 50:
            raise ValueError("Organization name must be at most 50 characters")
        return v

    def get_org_slug(self) -> str:
        """Generate URL-safe slug from organization name."""
        return slugify(self.organization_name)


class UserLogin(BaseModel):
    """User login schema."""
    email: EmailStr
    password: str


class Token(BaseModel):
    """Token response schema."""
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """User response schema."""
    id: str
    email: EmailStr
    full_name: Optional[str]
    role: str
    organization_id: str

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    """Login response schema."""
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    user: UserResponse
