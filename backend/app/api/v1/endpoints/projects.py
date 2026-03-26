"""
GECRAI 1.2 - Projects Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging

from fastapi import Request
from app.db.session import get_db
from app.core.security import get_current_user
from app.core.audit import log_action
from app.models.user import User
from app.models.project import Project, ProjectStatus, ProjectType
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from app.schemas.common import PaginatedResponse
from fastapi.responses import StreamingResponse
from app.models.calculation import Calculation
from app.services.pdf_generator import generate_project_report

router = APIRouter()
logger = logging.getLogger(__name__)




@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new project"""
    if not current_user.can_create_project():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to create projects"
        )

    project = Project(
        org_id=current_user.org_id,
        created_by=current_user.id,
        name=project_data.name,
        description=project_data.description,
        project_type=project_data.project_type,
        voltage_level=project_data.voltage_level,
        system_type=project_data.system_type,
        location=project_data.location,
    )

    db.add(project)
    await db.flush()
    
    # Audit Log
    await log_action(
        db,
        action="PROJECT_CREATE",
        user_id=current_user.id,
        resource_type="project",
        resource_id=str(project.id),
        details={"name": project.name},
        request=request
    )
    await db.commit() # Commit the project creation and audit log

    logger.info(
        f"Project created: {project.name} by user {current_user.email}")

    return project


@router.get("", response_model=PaginatedResponse[ProjectResponse])
async def list_projects(
    page: int = 1,
    page_size: int = 20,
    status_filter: Optional[ProjectStatus] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List projects in the organization"""
    # Apply pagination
    skip = (page - 1) * page_size
    query = query.offset(skip).limit(page_size).order_by(Project.created_at.desc())

    result = await db.execute(query)
    projects = result.scalars().all()

    # Get total count
    from sqlalchemy import func
    count_query = select(func.count(Project.id)).where(
        Project.org_id == current_user.org_id)
    if status_filter:
        count_query = count_query.where(Project.status == status_filter)
    count_result = await db.execute(count_query)
    total = count_result.scalar()

    # Pagination logic
    total_pages = (total + page_size - 1) // page_size

    return PaginatedResponse(
        items=projects,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1
    )


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get project by ID"""
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    # Check organization access
    if project.org_id != current_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    return ProjectResponse(
        id=str(project.id),
        name=project.name,
        description=project.description,
        project_type=project.project_type.value,
        status=project.status.value,
        voltage_level=project.voltage_level,
        system_type=project.system_type,
        location=project.location,
        created_at=project.created_at,
        updated_at=project.updated_at,
        organization_id=str(project.org_id),
        created_by=str(project.created_by) if project.created_by else None,
    )


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    update_data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    request: Request = Depends()
):
    """Update project"""
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    # Check organization access and permissions
    if project.org_id != current_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    if not current_user.can_edit_project():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to edit projects"
        )

    # Store old values for audit log details
    old_name = project.name
    old_description = project.description
    old_project_type = project.project_type
    old_status = project.status

    # Update fields
    if update_data.name is not None:
        project.name = update_data.name
    if update_data.description is not None:
        project.description = update_data.description
    if update_data.project_type is not None:
        project.project_type = update_data.project_type
    if update_data.voltage_level is not None:
        project.voltage_level = update_data.voltage_level
    if update_data.system_type is not None:
        project.system_type = update_data.system_type
    if update_data.location is not None:
        project.location = update_data.location
    if update_data.status is not None:
        project.status = update_data.status

    await db.flush()

    # Audit Log
    update_details = {
        "old_name": old_name, "new_name": project.name,
        "old_description": old_description, "new_description": project.description,
        "old_project_type": old_project_type.value, "new_project_type": project.project_type.value,
        "old_status": old_status.value, "new_status": project.status.value,
    }
    await log_action(
        db,
        action="PROJECT_UPDATE",
        user_id=current_user.id,
        resource_type="project",
        resource_id=str(project.id),
        details=update_details,
        request=request
    )
    await db.commit() # Commit the project update and audit log

    return ProjectResponse(
        id=str(project.id),
        name=project.name,
        description=project.description,
        project_type=project.project_type.value,
        status=project.status.value,
        voltage_level=project.voltage_level,
        system_type=project.system_type,
        location=project.location,
        created_at=project.created_at,
        updated_at=project.updated_at,
        organization_id=str(project.org_id),
        created_by=str(project.created_by) if project.created_by else None,
    )


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete project"""
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    # Check organization access and permissions
    if project.org_id != current_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to delete projects"
        )

    await db.delete(project)
    logger.info(
        f"Project deleted: {project.name} by user {current_user.email}")


@router.get("/{project_id}/report")
async def get_project_report(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Download project calculations report as PDF"""
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    # Check organization access
    if project.org_id != current_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    # Fetch calculations
    calc_result = await db.execute(
        select(Calculation).where(Calculation.project_id == project_id).order_by(Calculation.created_at.desc())
    )
    calculations = list(calc_result.scalars().all())

    # Generate PDF
    pdf_buffer = generate_project_report(project, calculations)

    # Create safe filename
    safe_name = "".join([c if c.isalnum() else "_" for c in project.name])

    headers = {
        'Content-Disposition': f'attachment; filename="memoria_calculo_{safe_name}.pdf"'
    }

    return StreamingResponse(pdf_buffer, media_type="application/pdf", headers=headers)

