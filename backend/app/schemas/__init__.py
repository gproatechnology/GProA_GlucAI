"""
GECRAI 1.2 - Pydantic Schemas
"""
from app.schemas.auth import UserRegister, UserLogin, Token, LoginResponse
from app.schemas.user import UserUpdate, UserResponse as UserDataResponse, UserListResponse
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse, ProjectListResponse
from app.schemas.calculation import (
    VoltageDropInput, 
    ConductorSizingInput, 
    CalculationCreate, 
    CalculationResponse
)
from app.schemas.audit import AuditLogCreate, AuditLogResponse
from app.schemas.common import Message, PaginatedResponse

__all__ = [
    "UserRegister",
    "UserLogin",
    "Token",
    "LoginResponse",
    "UserUpdate",
    "UserDataResponse",
    "UserListResponse",
    "ProjectCreate",
    "ProjectUpdate",
    "ProjectResponse",
    "ProjectListResponse",
    "VoltageDropInput",
    "ConductorSizingInput",
    "CalculationCreate",
    "CalculationResponse",
    "AuditLogCreate",
    "AuditLogResponse",
    "Message",
    "PaginatedResponse",
]
