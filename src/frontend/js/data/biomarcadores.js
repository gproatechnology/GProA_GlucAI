/**
 * GlucAI 2.0 — Definición de biomarcadores
 * 33 elementos de química sanguínea para diagnóstico glucémico.
 */

export const CLASES = ['Normal', 'Prediabetes', 'Riesgo'];

export const BIOMARCADORES = [
  { id: 'glucosa', nombre: 'Glucosa', unidad: 'mg/dL', peso: 1.0 },
  { id: 'hba1c', nombre: 'HbA1c', unidad: '%', peso: 1.0 },
  { id: 'insulina', nombre: 'Insulina', unidad: 'uIU/mL', peso: 0.8 },
  { id: 'sodio', nombre: 'Sodio (Na)', unidad: 'mEq/L', peso: 0.5 },
  { id: 'potasio', nombre: 'Potasio (K)', unidad: 'mEq/L', peso: 0.5 },
  { id: 'cloro', nombre: 'Cloro (Cl)', unidad: 'mEq/L', peso: 0.5 },
  { id: 'calcio', nombre: 'Calcio (Ca)', unidad: 'mg/dL', peso: 0.5 },
  { id: 'magnesio', nombre: 'Magnesio (Mg)', unidad: 'mg/dL', peso: 0.5 },
  { id: 'fosforo', nombre: 'Fósforo (P)', unidad: 'mg/dL', peso: 0.5 },
  { id: 'bun', nombre: 'BUN', unidad: 'mg/dL', peso: 0.6 },
  { id: 'creatinina', nombre: 'Creatinina', unidad: 'mg/dL', peso: 0.6 },
  { id: 'egfr', nombre: 'eGFR', unidad: 'mL/min', peso: 0.6 },
  { id: 'alt', nombre: 'ALT', unidad: 'U/L', peso: 0.5 },
  { id: 'ast', nombre: 'AST', unidad: 'U/L', peso: 0.5 },
  { id: 'alp', nombre: 'ALP', unidad: 'U/L', peso: 0.5 },
  { id: 'bilirrubina', nombre: 'Bilirrubina', unidad: 'mg/dL', peso: 0.5 },
  { id: 'proteina_total', nombre: 'Proteína total', unidad: 'g/dL', peso: 0.5 },
  { id: 'albumina', nombre: 'Albúmina', unidad: 'g/dL', peso: 0.5 },
  { id: 'colesterol', nombre: 'Colesterol total', unidad: 'mg/dL', peso: 0.7 },
  { id: 'trigliceridos', nombre: 'Triglicéridos', unidad: 'mg/dL', peso: 0.7 },
  { id: 'hdl', nombre: 'HDL', unidad: 'mg/dL', peso: 0.7 },
  { id: 'ldl', nombre: 'LDL', unidad: 'mg/dL', peso: 0.7 },
  { id: 'pcr', nombre: 'PCR', unidad: 'mg/L', peso: 0.6 },
  { id: 'ferritina', nombre: 'Ferritina', unidad: 'ng/mL', peso: 0.5 },
  { id: 'tsh', nombre: 'TSH', unidad: 'mIU/L', peso: 0.5 },
  { id: 't4', nombre: 'T4', unidad: 'µg/dL', peso: 0.5 },
  { id: 'acido_urico', nombre: 'Ácido úrico', unidad: 'mg/dL', peso: 0.5 },
  { id: 'ldh', nombre: 'LDH', unidad: 'U/L', peso: 0.5 },
  { id: 'cpk', nombre: 'CPK', unidad: 'U/L', peso: 0.5 },
  { id: 'amilasa', nombre: 'Amilasa', unidad: 'U/L', peso: 0.5 },
  { id: 'lipasa', nombre: 'Lipasa', unidad: 'U/L', peso: 0.5 },
  { id: 'ggt', nombre: 'GGT', unidad: 'U/L', peso: 0.5 },
  { id: 'homocisteina', nombre: 'Homocisteína', unidad: 'µmol/L', peso: 0.6 }
];

export const IDS_BIOMARCADORES = BIOMARCADORES.map(b => b.id);
