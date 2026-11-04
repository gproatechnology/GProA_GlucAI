/**
 * GlucAI 2.0 — Explicabilidad local
 * Identifica los biomarcadores que más separan al paciente del vecino más cercano.
 */

import { BIOMARCADORES } from '../data/biomarcadores.js';
import { normalizar } from './normalizacion.js';
import { DATASET } from '../data/dataset.js';

export function explicarResultado(entradaObj, resultadoKNN, topN = 5, pesos = {}) {
  if (!resultadoKNN || !resultadoKNN.vecinos || !resultadoKNN.vecinos.length) {
    return [];
  }

  const entradaVec = normalizar(entradaObj);
  const vecinoId = resultadoKNN.vecinos[0].id;

  const muestraVecino = DATASET.find(m => m.id === vecinoId) || resultadoKNN.vecinos[0];
  const vecinoVec = normalizar(muestraVecino.valores || muestraVecino);

  const contribuciones = BIOMARCADORES.map((b, i) => {
    const peso = pesos[b.id] ?? 1.0;
    const diff = Math.abs((entradaVec[i] || 0) - (vecinoVec[i] || 0)) * peso;
    return {
      id: b.id,
      nombre: b.nombre,
      unidad: b.unidad,
      valor: entradaObj[b.id],
      diff
    };
  });

  contribuciones.sort((a, b) => b.diff - a.diff);
  return contribuciones.slice(0, topN);
}
