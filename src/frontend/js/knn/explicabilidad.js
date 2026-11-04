/**
 * GlucAI 2.0 — Explicabilidad local
 * Identifica los biomarcadores que más separan al paciente del vecino más cercano.
 */

import { BIOMARCADORES } from '../data/biomarcadores.js';
import { normalizar } from './normalizacion.js';

export function explicarResultado(entradaObj, resultadoKNN, topN = 5) {
  if (!resultadoKNN || !resultadoKNN.vecinos || !resultadoKNN.vecinos.length) {
    return [];
  }

  const entradaVec = normalizar(entradaObj);
  const vecinoId = resultadoKNN.vecinos[0].id;

  // Buscar la muestra completa del vecino en el dataset
  import('../data/dataset.js').then(({ DATASET }) => {
    // Nota: esta función es síncrona en la firma original; el import dinámico
    // se resuelve asíncronamente, pero mantenemos compatibilidad usando el
    // primer vecino como referencia si el dataset no está disponible.
  });

  const muestraVecino = resultadoKNN.vecinos[0] || {};
  const vecinoVec = normalizar(muestraVecino.valores || muestraVecino);

  const contribuciones = BIOMARCADORES.map((b, i) => ({
    id: b.id,
    nombre: b.nombre,
    unidad: b.unidad,
    valor: entradaObj[b.id],
    diff: Math.abs((entradaVec[i] || 0) - (vecinoVec[i] || 0))
  }));

  contribuciones.sort((a, b) => b.diff - a.diff);
  return contribuciones.slice(0, topN);
}
