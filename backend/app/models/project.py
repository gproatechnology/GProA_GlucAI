"""
GECRAI 1.2 - Project Model
"""
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Enum, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.db.session import Base


class ProjectStatus(str, enum.Enum):
    """Project status"""
    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class ProjectType(str, enum.Enum):
    """Project types"""
    RESIDENTIAL = "residential"
    COMMERCIAL = "commercial"
    INDUSTRIAL = "industrial"
    UTILITY = "utility"


class Project(Base):
    """Project model for electrical engineering projects"""
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey(
        "organizations.id", ondelete="CASCADE"), nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey(
        "users.id", ondelete="SET NULL"), nullable=True)

    # Basic info
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    project_type = Column(Enum(ProjectType), default=ProjectType.COMMERCIAL)
    status = Column(Enum(ProjectStatus), default=ProjectStatus.DRAFT)

    # Electrical parameters
    voltage_level = Column(String(50), nullable=True)  # e.g., "480V", "208V"
    # "single_phase", "three_phase"
    system_type = Column(String(50), nullable=True)
    frequency = Column(String(10), default="60Hz")

    # Location
    location = Column(String(255), nullable=True)

    # Project metadata (renamed from 'metadata' to avoid SQLAlchemy conflict)
    project_metadata = Column(JSON, default=dict)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)

    # Relationships
    organization = relationship("Organization", back_populates="projects")
    created_by_user = relationship("User", back_populates="projects")
    calculations = relationship(
        "Calculation", back_populates="project", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Project {self.name}>"
