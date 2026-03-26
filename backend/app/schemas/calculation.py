from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

from app.models.calculation import CalculationType

class VoltageDropInput(BaseModel):
    """Input for voltage drop calculation with numeric validation"""
    conductor_material: str = Field(..., pattern="^(copper|aluminum)$")
    conductor_size: str = Field(..., min_length=1)
    length: float = Field(..., gt=0, le=100000)  # max 100km
    current: float = Field(..., gt=0, le=100000)  # max 100kA
    power_factor: float = Field(0.85, ge=0, le=1)
    voltage: float = Field(..., ge=1, le=500000)  # 1V - 500kV
    phases: int = Field(3, ge=1, le=3)

    @field_validator("phases")
    @classmethod
    def validate_phases(cls, v: int) -> int:
        if v not in [1, 3]:
            raise ValueError("Phases must be either 1 or 3")
        return v

class ConductorSizingInput(BaseModel):
    """Input for conductor sizing calculation with numeric validation"""
    load_current: float = Field(..., gt=0, le=100000)
    ambient_temperature: float = Field(30.0, ge=-50, le=100)
    insulation_type: str = Field("THHN", min_length=2)
    conduit_type: str = Field("PVC", min_length=2)
    num_conductors: int = Field(3, ge=1, le=48)
    voltage: float = Field(480.0, ge=1, le=500000)

class ShortCircuitInput(BaseModel):
    """Input for short circuit calculation with numeric validation"""
    transformer_kva: float = Field(..., gt=0, le=100000)
    transformer_impedance: float = Field(..., gt=0, le=100)
    system_voltage: float = Field(..., ge=1, le=500000)
    conductor_length: float = Field(..., ge=0, le=100000)
    conductor_impedance: float = Field(..., ge=0)

class CalculationCreate(BaseModel):
    """Create calculation request"""
    project_id: str
    name: str = Field(..., min_length=1, max_length=100)
    calculation_type: CalculationType
    description: Optional[str] = Field(None, max_length=500)
    input_data: Dict[str, Any]

class CalculationResponse(BaseModel):
    """Calculation response"""
    id: str
    name: str
    calculation_type: str
    description: Optional[str]
    input_data: Dict[str, Any]
    results: Dict[str, Any]
    compliance_status: Optional[str]
    violations: List[Any]
    recommendations: List[Any]
    created_at: datetime
    project_id: str

    class Config:
        from_attributes = True

class CalculationListResponse(BaseModel):
    calculations: List[CalculationResponse]
    total: int
