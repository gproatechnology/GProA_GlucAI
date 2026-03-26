"""
GECRAI 1.2 - Audit Logging Utilities
"""
from typing import Optional, Any, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Request
import logging

from app.models.audit_log import AuditLog

logger = logging.getLogger(__name__)

async def log_action(
    db: AsyncSession,
    action: str,
    user_id: Optional[Any] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    request: Optional[Request] = None
):
    """
    Record an action in the audit log
    """
    try:
        ip_address = None
        user_agent = None
        
        if request:
            ip_address = request.client.host if request.client else None
            user_agent = request.headers.get("user-agent")

        audit_entry = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        db.add(audit_entry)
        await db.commit()
        
        logger.info(f"Audit log: {action} by user {user_id}")
        
    except Exception as e:
        logger.error(f"Failed to record audit log: {str(e)}")
        # We don't raise here as audit logging failure shouldn't break the main flow
        # but in a stricter system, you might want it to.
