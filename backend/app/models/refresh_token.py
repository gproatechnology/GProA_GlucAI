"""
GECRAI 1.2 - Refresh Token Model
SQLAlchemy model for storing refresh tokens with rotation support
"""
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.db.session import Base


class RefreshToken(Base):
    """
    Refresh Token model for JWT refresh token rotation.
    
    Each refresh token has a unique JTI (JWT ID) that is stored in the
    database and can be revoked individually. This enables token rotation
    where each refresh invalidates the previous token.
    """
    __tablename__ = "refresh_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Unique JWT ID - used for token identification and revocation
    jti = Column(UUID(as_uuid=True), unique=True, nullable=False, index=True)
    
    # User association
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # Token data (stored encrypted in production)
    token = Column(String(512), nullable=False)
    
    # Expiration timestamp
    expires_at = Column(DateTime, nullable=False)
    
    # Revocation status
    revoked = Column(Boolean, default=False, nullable=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    revoked_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="refresh_tokens")

    def __repr__(self):
        return f"<RefreshToken jti={self.jti} user_id={self.user_id} revoked={self.revoked}>"

    @property
    def is_expired(self) -> bool:
        """Check if token has expired."""
        return datetime.utcnow() > self.expires_at

    @property
    def is_valid(self) -> bool:
        """Check if token is valid (not revoked and not expired)."""
        return not self.revoked and not self.is_expired
