"""
GECRAI 1.2 - Organization Model (Multi-tenant)
"""
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.db.session import Base


class PlanType(str, enum.Enum):
    """Subscription plan types"""
    FREE = "free"
    STARTER = "starter"
    PRO = "pro"
    ENTERPRISE = "enterprise"


class Organization(Base):
    """Organization model for multi-tenant SaaS"""
    __tablename__ = "organizations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)

    # Subscription
    plan = Column(Enum(PlanType), default=PlanType.FREE, nullable=False)
    max_users = Column(Integer, default=5)
    max_projects = Column(Integer, default=10)

    # Status
    is_active = Column(Boolean, default=True)

    # Stripe
    stripe_customer_id = Column(String(255), nullable=True)
    stripe_subscription_id = Column(String(255), nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)

    # Relationships
    users = relationship("User", back_populates="organization",
                         cascade="all, delete-orphan")
    projects = relationship(
        "Project", back_populates="organization", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Organization {self.name}>"

    @property
    def features(self) -> dict:
        """Get features based on plan"""
        features = {
            PlanType.FREE: {
                "users": 1,
                "projects": 3,
                "calculations_per_month": 100,
                "ai_queries_per_month": 50,
                "pdf_reports": False,
                "api_access": False,
                "priority_support": False,
            },
            PlanType.STARTER: {
                "users": 3,
                "projects": 10,
                "calculations_per_month": 500,
                "ai_queries_per_month": 200,
                "pdf_reports": True,
                "api_access": False,
                "priority_support": False,
            },
            PlanType.PRO: {
                "users": 10,
                "projects": 50,
                "calculations_per_month": 2000,
                "ai_queries_per_month": 1000,
                "pdf_reports": True,
                "api_access": True,
                "priority_support": True,
            },
            PlanType.ENTERPRISE: {
                "users": -1,  # Unlimited
                "projects": -1,
                "calculations_per_month": -1,
                "ai_queries_per_month": -1,
                "pdf_reports": True,
                "api_access": True,
                "priority_support": True,
            },
        }
        return features.get(self.plan, features[PlanType.FREE])
