"""Add performance indexes for high-traffic queries

Revision ID: a1b2c3d4e5f6
Revises: 7fb1ad35de9d
Create Date: 2026-03-05 12:40:00.000000

ARCH-004: Index optimization for frequent query patterns.
Targets: users.email, org_id lookups, project/calculation filters, audit_log lookups.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '7fb1ad35de9d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add performance indexes."""
    with op.batch_alter_table('users', schema=None) as batch_op:
        # email is already unique, but adding explicit index for speed
        batch_op.create_index('ix_users_email', ['email'], unique=True)
        # Fast org membership lookups
        batch_op.create_index('ix_users_org_id', ['org_id'], unique=False)
        # Filter active users quickly
        batch_op.create_index('ix_users_is_active', ['is_active'], unique=False)

    with op.batch_alter_table('projects', schema=None) as batch_op:
        # Most common filter: projects per org
        batch_op.create_index('ix_projects_org_id', ['org_id'], unique=False)
        # Filter by status (active, archived, etc.)
        batch_op.create_index('ix_projects_status', ['status'], unique=False)
        # Combined index for the most common query: active projects by org
        batch_op.create_index(
            'ix_projects_org_status', ['org_id', 'status'], unique=False
        )
        # Sort/filter by creation time
        batch_op.create_index('ix_projects_created_at', ['created_at'], unique=False)

    with op.batch_alter_table('calculations', schema=None) as batch_op:
        # Most common: calculations for a project
        batch_op.create_index(
            'ix_calculations_project_id', ['project_id'], unique=False
        )
        # Filter by calculation type
        batch_op.create_index(
            'ix_calculations_calc_type', ['calculation_type'], unique=False
        )
        # Sort by time for history views
        batch_op.create_index(
            'ix_calculations_created_at', ['created_at'], unique=False
        )

    with op.batch_alter_table('audit_logs', schema=None) as batch_op:
        # Audit trail queries by user
        batch_op.create_index('ix_audit_logs_user_id', ['user_id'], unique=False)
        # Filter by action type
        batch_op.create_index('ix_audit_logs_action', ['action'], unique=False)
        # Time-range queries on audit logs
        batch_op.create_index(
            'ix_audit_logs_created_at', ['created_at'], unique=False
        )

    with op.batch_alter_table('refresh_tokens', schema=None) as batch_op:
        # Fast JTI lookups for token validation
        batch_op.create_index('ix_refresh_tokens_jti', ['jti'], unique=True)
        # Filter active tokens by user at logout
        batch_op.create_index(
            'ix_refresh_tokens_user_id_revoked', ['user_id', 'revoked'], unique=False
        )


def downgrade() -> None:
    """Remove performance indexes."""
    with op.batch_alter_table('refresh_tokens', schema=None) as batch_op:
        batch_op.drop_index('ix_refresh_tokens_user_id_revoked')
        batch_op.drop_index('ix_refresh_tokens_jti')

    with op.batch_alter_table('audit_logs', schema=None) as batch_op:
        batch_op.drop_index('ix_audit_logs_created_at')
        batch_op.drop_index('ix_audit_logs_action')
        batch_op.drop_index('ix_audit_logs_user_id')

    with op.batch_alter_table('calculations', schema=None) as batch_op:
        batch_op.drop_index('ix_calculations_created_at')
        batch_op.drop_index('ix_calculations_calc_type')
        batch_op.drop_index('ix_calculations_project_id')

    with op.batch_alter_table('projects', schema=None) as batch_op:
        batch_op.drop_index('ix_projects_created_at')
        batch_op.drop_index('ix_projects_org_status')
        batch_op.drop_index('ix_projects_status')
        batch_op.drop_index('ix_projects_org_id')

    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_index('ix_users_is_active')
        batch_op.drop_index('ix_users_org_id')
        batch_op.drop_index('ix_users_email')
