"""
GECRAI 1.2 - Dashboard Endpoint
Provides aggregated statistics and data for the dashboard
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta
from typing import List
from pydantic import BaseModel

from app.db.session import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.calculation import Calculation

router = APIRouter()


# Response Schemas
class DashboardStats(BaseModel):
    total_projects: int
    active_projects: int
    total_calculations: int
    calculations_this_month: int
    reports_generated: int
    team_members: int

    class Config:
        populate_by_name = True
        alias_generator = lambda s: "".join(
            word.capitalize() if i > 0 else word 
            for i, word in enumerate(s.split("_"))
        )


class RecentProject(BaseModel):
    id: str
    name: str
    status: str
    created_at: str
    calculations_count: int

    class Config:
        populate_by_name = True
        alias_generator = lambda s: "".join(
            word.capitalize() if i > 0 else word 
            for i, word in enumerate(s.split("_"))
        )


class RecentActivity(BaseModel):
    id: str
    type: str
    description: str
    timestamp: str
    user: str | None = None

    class Config:
        populate_by_name = True
        alias_generator = lambda s: "".join(
            word.capitalize() if i > 0 else word 
            for i, word in enumerate(s.split("_"))
        )


class ChartData(BaseModel):
    name: str
    value: int


class MonthlyData(BaseModel):
    month: str
    projects: int
    calculations: int


class DashboardResponse(BaseModel):
    stats: DashboardStats
    recent_projects: List[RecentProject]
    recent_activity: List[RecentActivity]
    calculations_by_type: List[ChartData]
    projects_by_month: List[MonthlyData]

    class Config:
        populate_by_name = True
        alias_generator = lambda s: "".join(
            word.capitalize() if i > 0 else word 
            for i, word in enumerate(s.split("_"))
        )


@router.get("", response_model=DashboardResponse)
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get dashboard data for the current user's organization"""

    org_id = current_user.org_id

    # Get stats
    # Total projects
    total_projects_result = await db.execute(
        select(func.count(Project.id)).where(Project.org_id == org_id)
    )
    total_projects = total_projects_result.scalar() or 0

    # Active projects
    active_projects_result = await db.execute(
        select(func.count(Project.id)).where(
            Project.org_id == org_id,
            Project.status == 'active'
        )
    )
    active_projects = active_projects_result.scalar() or 0

    # Total calculations
    total_calculations_result = await db.execute(
        select(func.count(Calculation.id)).where(Calculation.org_id == org_id)
    )
    total_calculations = total_calculations_result.scalar() or 0

    # Calculations this month
    month_start = datetime.utcnow().replace(
        day=1, hour=0, minute=0, second=0, microsecond=0)
    calculations_month_result = await db.execute(
        select(func.count(Calculation.id)).where(
            Calculation.org_id == org_id,
            Calculation.created_at >= month_start
        )
    )
    calculations_this_month = calculations_month_result.scalar() or 0

    # Team members
    team_members_result = await db.execute(
        select(func.count(User.id)).where(
            User.org_id == org_id, User.is_active == True)
    )
    team_members = team_members_result.scalar() or 0

    # Recent projects
    recent_projects_result = await db.execute(
        select(Project)
        .where(Project.org_id == org_id)
        .order_by(Project.created_at.desc())
        .limit(5)
    )
    recent_projects_data = recent_projects_result.scalars().all()

    recent_projects = [
        RecentProject(
            id=str(p.id),
            name=p.name,
            status=p.status,
            created_at=p.created_at.isoformat() if p.created_at else "",
            calculations_count=0  # TODO: Add calculation count
        )
        for p in recent_projects_data
    ]

    # Mock data for charts (TODO: implement real queries)
    calculations_by_type = [
        {"name": "Caída de Tensión", "value": 45},
        {"name": "Dimensionamiento", "value": 38},
        {"name": "Cortocircuito", "value": 25},
        {"name": "Arco Eléctrico", "value": 18},
        {"name": "Factor de Potencia", "value": 30},
    ]

    projects_by_month = [
        {"month": "Sep", "projects": 2, "calculations": 15},
        {"month": "Oct", "projects": 3, "calculations": 28},
        {"month": "Nov", "projects": 2, "calculations": 22},
        {"month": "Dic", "projects": 4, "calculations": 45},
        {"month": "Ene", "projects": 3, "calculations": 38},
        {"month": "Feb", "projects": 5, "calculations": 52},
    ]

    recent_activity = [
        RecentActivity(
            id="1",
            type="calculation",
            description="Cálculo de caída de tensión realizado",
            timestamp=datetime.utcnow().isoformat(),
            user=current_user.full_name
        )
    ]

    return DashboardResponse(
        stats=DashboardStats(
            total_projects=total_projects,
            active_projects=active_projects,
            total_calculations=total_calculations,
            calculations_this_month=calculations_this_month,
            reports_generated=0,  # TODO: Implement
            team_members=team_members
        ),
        recent_projects=recent_projects,
        recent_activity=recent_activity,
        calculations_by_type=[ChartData(**d) for d in calculations_by_type],
        projects_by_month=[MonthlyData(**d) for d in projects_by_month]
    )
