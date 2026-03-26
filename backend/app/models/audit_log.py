"""
GECRAI 1.2 - Audit Log Model
"""
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.db.session import Base


class AuditLog(Base):
    """Audit log model for tracking user actions and sensitive events"""
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey(
        "users.id", ondelete="SET NULL"), nullable=True)
    
    # Action info
    action = Column(String(100), nullable=False)  # e.g., "LOGIN", "PROJECT_CREATE"
    resource_type = Column(String(50), nullable=True)  # e.g., "project"
    resource_id = Column(String(100), nullable=True)
    
    # Metadata
    details = Column(JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(255), nullable=True)
    
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="audit_logs")

    def __repr__(self):
        return f"<AuditLog {self.action} by {self.user_id}>"
