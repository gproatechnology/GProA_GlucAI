"""
GECRAI 1.2 - Calculation Model
"""
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Enum, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.db.session import Base


class CalculationType(str, enum.Enum):
    """Types of electrical calculations"""
    VOLTAGE_DROP = "voltage_drop"
    CONDUCTOR_SIZING = "conductor_sizing"
    SHORT_CIRCUIT = "short_circuit"
    ARC_FLASH = "arc_flash"
    LOAD_ANALYSIS = "load_analysis"
    POWER_FACTOR = "power_factor"
    PROTECTION_COORDINATION = "protection_coordination"
    TRANSFORMER_SIZING = "transformer_sizing"
    GROUNDING = "grounding"


class Calculation(Base):
    """Calculation model for storing electrical calculation results"""
    __tablename__ = "calculations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey(
        "projects.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey(
        "users.id", ondelete="SET NULL"), nullable=True)

    # Calculation info
    name = Column(String(255), nullable=False)
    calculation_type = Column(Enum(CalculationType), nullable=False)
    description = Column(Text, nullable=True)

    # Input and Output
    input_data = Column(JSON, nullable=False, default=dict)
    results = Column(JSON, nullable=False, default=dict)

    # Compliance
    # "compliant", "non_compliant", "warning"
    compliance_status = Column(String(50), nullable=True)
    violations = Column(JSON, default=list)
    recommendations = Column(JSON, default=list)

    # Standards reference
    # e.g., ["NOM-001-SEDE-2012", "NEC-2020"]
    standards_referenced = Column(JSON, default=list)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="calculations")
    user = relationship("User", back_populates="calculations")

    def __repr__(self):
        return f"<Calculation {self.name} - {self.calculation_type}>"

    @property
    def is_compliant(self) -> bool:
        return self.compliance_status == "compliant"
