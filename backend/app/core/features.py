"""
GECRAI 1.2 - Feature Flags System (ARCH-005)
Controls feature access based on the organization's subscription plan.

Usage:
    from app.core.features import require_feature, FeatureFlag

    @router.post("/generate-pdf")
    async def generate_pdf(
        _: None = Depends(require_feature(FeatureFlag.PDF_REPORTS)),
        current_user: User = Depends(get_current_user),
    ):
        ...
"""
from enum import Enum
from typing import Any, Optional
from fastapi import Depends, HTTPException, status

from app.models.user import User
from app.models.organization import Organization, PlanType
from app.core.security import get_current_user
from app.db.session import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select


class FeatureFlag(str, Enum):
    """All controllable features across subscription plans."""
    PDF_REPORTS       = "pdf_reports"
    API_ACCESS        = "api_access"
    PRIORITY_SUPPORT  = "priority_support"
    # Add future feature flags here — no code changes needed in endpoints
    ADVANCED_ANALYTICS = "advanced_analytics"
    MULTI_USER        = "multi_user"


# Plan-to-features mapping (single source of truth)
PLAN_FEATURES: dict[PlanType, dict[str, Any]] = {
    PlanType.FREE: {
        FeatureFlag.PDF_REPORTS:        False,
        FeatureFlag.API_ACCESS:         False,
        FeatureFlag.PRIORITY_SUPPORT:   False,
        FeatureFlag.ADVANCED_ANALYTICS: False,
        FeatureFlag.MULTI_USER:         False,
        "max_users":                    1,
        "max_projects":                 3,
        "calculations_per_month":       100,
    },
    PlanType.STARTER: {
        FeatureFlag.PDF_REPORTS:        True,
        FeatureFlag.API_ACCESS:         False,
        FeatureFlag.PRIORITY_SUPPORT:   False,
        FeatureFlag.ADVANCED_ANALYTICS: False,
        FeatureFlag.MULTI_USER:         True,
        "max_users":                    3,
        "max_projects":                 10,
        "calculations_per_month":       500,
    },
    PlanType.PRO: {
        FeatureFlag.PDF_REPORTS:        True,
        FeatureFlag.API_ACCESS:         True,
        FeatureFlag.PRIORITY_SUPPORT:   True,
        FeatureFlag.ADVANCED_ANALYTICS: True,
        FeatureFlag.MULTI_USER:         True,
        "max_users":                    10,
        "max_projects":                 50,
        "calculations_per_month":       2000,
    },
    PlanType.ENTERPRISE: {
        FeatureFlag.PDF_REPORTS:        True,
        FeatureFlag.API_ACCESS:         True,
        FeatureFlag.PRIORITY_SUPPORT:   True,
        FeatureFlag.ADVANCED_ANALYTICS: True,
        FeatureFlag.MULTI_USER:         True,
        "max_users":                    -1,  # Unlimited
        "max_projects":                 -1,
        "calculations_per_month":       -1,
    },
}


def get_plan_features(plan: PlanType) -> dict[str, Any]:
    """Return the feature set for a given plan."""
    return PLAN_FEATURES.get(plan, PLAN_FEATURES[PlanType.FREE])


def has_feature(plan: PlanType, feature: FeatureFlag) -> bool:
    """Check if a plan includes a specific feature flag."""
    return bool(get_plan_features(plan).get(feature, False))


def require_feature(feature: FeatureFlag):
    """
    FastAPI dependency factory: raises 403 if the current user's organization
    does not have access to the specified feature flag.

    Example:
        @router.post("/export-pdf")
        async def export(
            _: None = Depends(require_feature(FeatureFlag.PDF_REPORTS))
        ):
            ...
    """
    async def _check(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
    ) -> None:
        # Fetch the organization
        result = await db.execute(
            select(Organization).where(Organization.id == current_user.org_id)
        )
        org = result.scalar_one_or_none()

        if not org:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization not found"
            )

        if not has_feature(org.plan, feature):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Feature '{feature.value}' is not available on your current plan. "
                       f"Please upgrade to access this feature."
            )

    return _check


async def get_current_org_features(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """
    Dependency that returns the full feature set for the current org.
    Use this to expose feature flags to the frontend via an API endpoint.
    """
    result = await db.execute(
        select(Organization).where(Organization.id == current_user.org_id)
    )
    org = result.scalar_one_or_none()
    if not org:
        return get_plan_features(PlanType.FREE)
    return get_plan_features(org.plan)
