"""
GECRAI 1.2 - Electrical Engineering Constants
NEC/NOM-001-SEDE standard tables and coefficients.
"""

# ============================================
# Conductor Resistance Values (Ohm/km at 75°C)
# Source: NEC Table 9, NOM-001-SEDE-2012
# ============================================
CONDUCTOR_RESISTANCE: dict[str, dict[str, float]] = {
    "copper": {
        "14 AWG": 8.21, "12 AWG": 5.17, "10 AWG": 3.26, "8 AWG": 2.05,
        "6 AWG": 1.29, "4 AWG": 0.81, "2 AWG": 0.51, "1 AWG": 0.41,
        "1/0 AWG": 0.32, "2/0 AWG": 0.26, "3/0 AWG": 0.20, "4/0 AWG": 0.16,
        "250 kcmil": 0.14, "300 kcmil": 0.11, "350 kcmil": 0.10,
        "400 kcmil": 0.088, "500 kcmil": 0.070,
    },
    "aluminum": {
        "14 AWG": 13.2, "12 AWG": 8.30, "10 AWG": 5.22, "8 AWG": 3.28,
        "6 AWG": 2.07, "4 AWG": 1.30, "2 AWG": 0.82, "1 AWG": 0.65,
        "1/0 AWG": 0.52, "2/0 AWG": 0.41, "3/0 AWG": 0.33, "4/0 AWG": 0.26,
        "250 kcmil": 0.22, "300 kcmil": 0.19, "350 kcmil": 0.16,
    }
}

# ============================================
# Conductor Ampacity Table (Amps at 30°C ambient)
# Source: NEC Table 310.16 - Copper THHN conductors
# ============================================
CONDUCTOR_AMPACITY: dict[str, int] = {
    "14 AWG": 15, "12 AWG": 20, "10 AWG": 30, "8 AWG": 40,
    "6 AWG": 55, "4 AWG": 70, "2 AWG": 95, "1 AWG": 110,
    "1/0 AWG": 125, "2/0 AWG": 145, "3/0 AWG": 165, "4/0 AWG": 195,
    "250 kcmil": 215, "300 kcmil": 240, "350 kcmil": 260,
    "400 kcmil": 280, "500 kcmil": 320,
}

# ============================================
# Temperature Correction Factors
# Source: NEC Table 310.15(B)(1)(a) at 30°C base
# ============================================
TEMPERATURE_CORRECTION_FACTORS: dict[int, float] = {
    30: 1.00,
    35: 0.94,
    40: 0.88,
    45: 0.82,
    50: 0.75,
}

# ============================================
# Compliance Thresholds (NEC 210.19)
# ============================================
VOLTAGE_DROP_WARNING_PERCENT = 3.0   # Warning for branch circuits
VOLTAGE_DROP_ERROR_PERCENT = 5.0     # Error threshold
NEC_CONTINUOUS_LOAD_FACTOR = 1.25    # 125% for continuous loads
MAX_SINGLE_CONDUCTOR_AMPACITY = 320  # Above this: parallel runs required

# Referenced standards
STANDARDS_VOLTAGE_DROP = ["NOM-001-SEDE-2012", "NEC-2020 Article 210.19"]
STANDARDS_CONDUCTOR_SIZING = ["NOM-001-SEDE-2012", "NEC-2020 Table 310.16"]
