from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from app.models.project import ProjectStatus, ProjectType

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    project_type: ProjectType = ProjectType.COMMERCIAL
    voltage_level: Optional[str] = None
    system_type: Optional[str] = None
    location: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    project_type: Optional[ProjectType] = None
    voltage_level: Optional[str] = None
    system_type: Optional[str] = None
    location: Optional[str] = None
    status: Optional[ProjectStatus] = None

class ProjectResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    project_type: str
    status: str
    voltage_level: Optional[str]
    system_type: Optional[str]
    location: Optional[str]
    created_at: datetime
    updated_at: datetime
    organization_id: UUID
    created_by: Optional[UUID]

    class Config:
        from_attributes = True

class ProjectListResponse(BaseModel):
    projects: List[ProjectResponse]
    total: int
