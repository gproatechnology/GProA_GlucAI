"""
GECRAI 1.2 - Calculations Endpoints
Electrical calculation API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging
from fastapi.responses import StreamingResponse

from app.db.session import get_db
from app.core.security import get_current_user
from app.core.audit import log_action
from app.models.user import User
from app.models.project import Project
from app.models.calculation import Calculation, CalculationType
from app.schemas.calculation import (
    VoltageDropInput,
    ConductorSizingInput,
    CalculationCreate,
    CalculationResponse,
)
from app.schemas.common import PaginatedResponse
from app.constants.electrical import (
    CONDUCTOR_RESISTANCE,
    CONDUCTOR_AMPACITY,
    TEMPERATURE_CORRECTION_FACTORS,
    VOLTAGE_DROP_WARNING_PERCENT,
    VOLTAGE_DROP_ERROR_PERCENT,
    NEC_CONTINUOUS_LOAD_FACTOR,
    MAX_SINGLE_CONDUCTOR_AMPACITY,
    STANDARDS_VOLTAGE_DROP,
    STANDARDS_CONDUCTOR_SIZING,
)
from app.core.cache import get_cached_result, set_cached_result

router = APIRouter()
logger = logging.getLogger(__name__)


# Schemas removed (now in app.schemas.calculation)


# ============== Calculation Services ==============

def calculate_voltage_drop(data: VoltageDropInput) -> Dict[str, Any]:
    """
    Calculate voltage drop based on conductor parameters.
    Based on NOM-001-SEDE-2012 and NEC standards.
    """
    material = data.conductor_material.lower()
    size = data.conductor_size.upper()

    if material not in CONDUCTOR_RESISTANCE:
        raise ValueError(f"Unknown conductor material: {material}")
    if size not in CONDUCTOR_RESISTANCE[material]:
        raise ValueError(f"Unknown conductor size: {size}")

    resistance_per_km = CONDUCTOR_RESISTANCE[material][size]
    length_km = data.length / 1000

    if data.phases == 3:
        voltage_drop = 1.732 * data.current * resistance_per_km * length_km
    else:
        voltage_drop = 2 * data.current * resistance_per_km * length_km

    voltage_drop_percent = (voltage_drop / data.voltage) * 100

    violations = []
    recommendations = []

    if voltage_drop_percent > VOLTAGE_DROP_ERROR_PERCENT:
        violations.append({
            "code": "NEC-210.19",
            "message": f"Voltage drop ({voltage_drop_percent:.2f}%) exceeds {VOLTAGE_DROP_ERROR_PERCENT}% limit",
            "severity": "error"
        })
        recommendations.append(
            "Consider using a larger conductor size or reducing circuit length")
    elif voltage_drop_percent > VOLTAGE_DROP_WARNING_PERCENT:
        violations.append({
            "code": "NEC-210.19",
            "message": f"Voltage drop ({voltage_drop_percent:.2f}%) exceeds {VOLTAGE_DROP_WARNING_PERCENT}% recommendation for branch circuits",
            "severity": "warning"
        })
        recommendations.append(
            "Consider upsizing conductor for better efficiency")

    compliance_status = "compliant" if not violations else "non_compliant" if any(
        v["severity"] == "error" for v in violations) else "warning"

    return {
        "voltage_drop_volts": round(voltage_drop, 2),
        "voltage_drop_percent": round(voltage_drop_percent, 2),
        "final_voltage": round(data.voltage - voltage_drop, 2),
        "compliance_status": compliance_status,
        "violations": violations,
        "recommendations": recommendations,
        "standards_referenced": STANDARDS_VOLTAGE_DROP,
    }


def calculate_conductor_sizing(data: ConductorSizingInput) -> Dict[str, Any]:
    """
    Calculate minimum conductor size based on load current.
    Based on NEC Table 310.16.
    """
    temp = min(data.ambient_temperature, 50)
    temp_factor = TEMPERATURE_CORRECTION_FACTORS.get(int(temp), 0.75)
    required_ampacity = data.load_current * NEC_CONTINUOUS_LOAD_FACTOR

    min_size = None
    for size, ampacity in CONDUCTOR_AMPACITY.items():
        corrected_ampacity = ampacity * temp_factor
        if corrected_ampacity >= required_ampacity:
            min_size = size
            break

    if not min_size:
        min_size = "500 kcmil or larger (parallel runs required)"

    violations = []
    recommendations = []

    if required_ampacity > MAX_SINGLE_CONDUCTOR_AMPACITY:
        violations.append({
            "code": "NEC-310.16",
            "message": "Load requires parallel conductors or busway",
            "severity": "warning"
        })
        recommendations.append(
            "Consider using parallel conductors or busway system")

    return {
        "minimum_conductor_size": min_size,
        "required_ampacity": round(required_ampacity, 2),
        "temperature_correction_factor": temp_factor,
        "ambient_temperature": data.ambient_temperature,
        "compliance_status": "compliant" if min_size else "non_compliant",
        "violations": violations,
        "recommendations": recommendations,
        "standards_referenced": STANDARDS_CONDUCTOR_SIZING,
    }


# ============== API Endpoints ==============

@router.post("/voltage-drop")
async def calculate_voltage_drop_endpoint(
    data: VoltageDropInput,
    current_user: User = Depends(get_current_user)
):
    """Calculate voltage drop for a conductor run. Results are cached for 1 hour."""
    params = data.model_dump()
    # Try to get from cache first
    cached = get_cached_result("voltage_drop", params)
    if cached:
        cached["_cache"] = "hit"
        return cached
    try:
        result = calculate_voltage_drop(data)
        set_cached_result("voltage_drop", params, result)
        result["_cache"] = "miss"
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/conductor-sizing")
async def calculate_conductor_sizing_endpoint(
    data: ConductorSizingInput,
    current_user: User = Depends(get_current_user)
):
    """Calculate minimum conductor size for a load. Results are cached for 1 hour."""
    params = data.model_dump()
    cached = get_cached_result("conductor_sizing", params)
    if cached:
        cached["_cache"] = "hit"
        return cached
    try:
        result = calculate_conductor_sizing(data)
        set_cached_result("conductor_sizing", params, result)
        result["_cache"] = "miss"
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("", response_model=CalculationResponse, status_code=status.HTTP_201_CREATED)
async def create_calculation(
    calc_data: CalculationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create and store a calculation"""
    # Verify project exists and user has access
    result = await db.execute(select(Project).where(Project.id == calc_data.project_id))
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    if project.org_id != current_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    # Perform calculation based on type
    results = {}
    if calc_data.calculation_type == CalculationType.VOLTAGE_DROP:
        results = calculate_voltage_drop(
            VoltageDropInput(**calc_data.input_data))
    elif calc_data.calculation_type == CalculationType.CONDUCTOR_SIZING:
        results = calculate_conductor_sizing(
            ConductorSizingInput(**calc_data.input_data))
    else:
        results = {"message": "Calculation type not yet implemented"}

    # Create calculation record
    calculation = Calculation(
        project_id=calc_data.project_id,
        user_id=current_user.id,
        name=calc_data.name,
        calculation_type=calc_data.calculation_type,
        description=calc_data.description,
        input_data=calc_data.input_data,
        results=results,
        compliance_status=results.get("compliance_status"),
        violations=results.get("violations", []),
        recommendations=results.get("recommendations", []),
        standards_referenced=results.get("standards_referenced", []),
    )

    db.add(calculation)
    await db.flush()

    # Audit Log
    await log_action(
        db,
        action="CALCULATION_CREATE",
        user_id=current_user.id,
        resource_type="calculation",
        resource_id=str(calculation.id),
        details={"name": calculation.name, "type": calculation.calculation_type},
        request=request
    )

    logger.info(
        f"Calculation created: {calculation.name} by {current_user.email}")

    return CalculationResponse(
        id=str(calculation.id),
        name=calculation.name,
        calculation_type=calculation.calculation_type.value,
        description=calculation.description,
        input_data=calculation.input_data,
        results=calculation.results,
        compliance_status=calculation.compliance_status,
        violations=calculation.violations,
        recommendations=calculation.recommendations,
        created_at=calculation.created_at,
        project_id=str(calculation.project_id),
    )


@router.get("/project/{project_id}", response_model=PaginatedResponse[CalculationResponse])
async def list_project_calculations(
    project_id: str,
    page: int = 1,
    page_size: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    request: Request = Depends()
):
    """List calculations for a project"""
    # Verify project access
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    if project.org_id != current_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    # Get calculations
    skip = (page - 1) * page_size
    result = await db.execute(
        select(Calculation)
        .where(Calculation.project_id == project_id)
        .offset(skip)
        .limit(page_size)
        .order_by(Calculation.created_at.desc())
    )
    calculations = result.scalars().all()

    # Get total
    from sqlalchemy import func
    count_result = await db.execute(
        select(func.count(Calculation.id)).where(
            Calculation.project_id == project_id)
    )
    total = count_result.scalar()

    # Pagination logic
    total_pages = (total + page_size - 1) // page_size

    return PaginatedResponse(
        items=calculations,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1
    )


@router.get("/{calculation_id}", response_model=CalculationResponse)
async def get_calculation(
    calculation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get calculation by ID"""
    result = await db.execute(select(Calculation).where(Calculation.id == calculation_id))
    calculation = result.scalar_one_or_none()

    if not calculation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Calculation not found"
        )

    # Verify access through project
    project_result = await db.execute(select(Project).where(Project.id == calculation.project_id))
    project = project_result.scalar_one_or_none()

    if not project or project.org_id != current_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    return CalculationResponse(
        id=str(calculation.id),
        name=calculation.name,
        calculation_type=calculation.calculation_type.value,
        description=calculation.description,
        input_data=calculation.input_data,
        results=calculation.results,
        compliance_status=calculation.compliance_status,
        violations=calculation.violations,
        recommendations=calculation.recommendations,
        created_at=calculation.created_at,
        project_id=str(calculation.project_id),
    )


@router.get("/{calculation_id}/report")
async def get_calculation_report(
    calculation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate and download PDF report for a calculation"""
    result = await db.execute(select(Calculation).where(Calculation.id == calculation_id))
    calculation = result.scalar_one_or_none()

    if not calculation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Calculation not found"
        )

    # Verify access through project
    project_result = await db.execute(select(Project).where(Project.id == calculation.project_id))
    project = project_result.scalar_one_or_none()

    if not project or project.org_id != current_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    # Generate PDF
    from app.services.pdf_generator import generate_calculation_report
    pdf_buffer = generate_calculation_report(calculation)

    await log_action(
        db,
        action="CALCULATION_REPORT_DOWNLOAD",
        user_id=current_user.id,
        resource_type="calculation",
        resource_id=str(calculation.id),
        details={"name": calculation.name, "type": calculation.calculation_type.value if hasattr(calculation.calculation_type, 'value') else "unknown"}
    )

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=Memoria_{calculation.name.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.pdf"
        }
    )
