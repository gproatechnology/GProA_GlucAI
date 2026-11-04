/**
 * GlucAI 2.0 — Normalización Z-score
 * (x - mean) / std usando estadísticas del dataset de entrenamiento.
 */

import { BIOMARCADORES } from '../data/biomarcadores.js';
import { STATS } from '../data/dataset.js';

export function normalizar(valores = {}) {
  return BIOMARCADORES.map(b => {
    const v = Number(valores[b.id]) || 0;
    const { mean, std } = STATS[b.id] || { mean: 0, std: 1 };
    const z = std === 0 ? 0 : (v - mean) / std;
    return Math.round(z * 1000) / 1000;
  });
}
