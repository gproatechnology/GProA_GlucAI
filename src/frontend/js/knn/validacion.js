/**
 * GlucAI 2.0 — Validación de entradas
 * Rechaza valores faltantes, no numéricos o fuera de rango clínico.
 */

import { BIOMARCADORES } from '../data/biomarcadores.js';
import { STATS } from '../data/dataset.js';

export const RANGOS = {
  glucosa: [20, 600], hba1c: [2, 15], insulina: [0, 100], sodio: [120, 160],
  potasio: [2, 7], cloro: [80, 120], calcio: [7, 12], magnesio: [1, 3],
  fosforo: [1, 6], bun: [5, 50], creatinina: [0.3, 3], egfr: [30, 150],
  alt: [5, 150], ast: [5, 150], alp: [20, 200], bilirrubina: [0.1, 3],
  proteina_total: [5, 9], albumina: [3, 5.5], colesterol: [100, 350],
  trigliceridos: [50, 400], hdl: [20, 100], ldl: [50, 250], pcr: [0.5, 20],
  ferritina: [20, 500], tsh: [0.1, 10], t4: [3, 14], acido_urico: [2, 12],
  ldh: [80, 400], cpk: [30, 400], amilasa: [20, 200], lipasa: [10, 150],
  ggt: [10, 100], homocisteina: [5, 30]
};

export function validarEntradas(valores = {}) {
  for (const b of BIOMARCADORES) {
    const v = valores[b.id];
    if (v === undefined || v === null || typeof v !== 'number' || !isFinite(v)) {
      return { valido: false, motivo: `Valor faltante o no numérico: ${b.nombre}` };
    }
    const [min, max] = RANGOS[b.id] || [0, Infinity];
    if (v < min || v > max) {
      return { valido: false, motivo: `${b.nombre} fuera de rango clínico (${min}-${max})` };
    }
  }
  return { valido: true, motivo: '' };
}
