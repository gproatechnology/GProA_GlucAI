/**
 * GlucAI 2.0 — Clasificador KNN (k-vecinos más cercanos)
 * Clasificación con votación por mayoría, confianza proporcional y pesos personalizables.
 */

import { BIOMARCADORES } from '../data/biomarcadores.js';
import { DATASET } from '../data/dataset.js';
import { normalizar } from './normalizacion.js';
import { distanciaPonderada } from './distancia.js';

const DEFAULT_K = 5;
const PESOS_POR_DEFECTO = {};

BIOMARCADORES.forEach(b => {
  PESOS_POR_DEFECTO[b.id] = b.peso;
});

/**
 * Obtiene los pesos a usar: prefiere los del usuario, si no los por defecto del biomarcador
 */
function resolverPesos(preferencias) {
  if (!preferencias || !preferencias.pesos) return PESOS_POR_DEFECTO;
  const pesos = {};
  BIOMARCADORES.forEach(b => {
    pesos[b.id] = preferencias.pesos[b.id] ?? PESOS_POR_DEFECTO[b.id];
  });
  return pesos;
}

export function clasificarKNN(dataset, entradaObj, k = DEFAULT_K, pesos = PESOS_POR_DEFECTO) {
  if (!dataset || !entradaObj || !BIOMARCADORES.length) {
    return { clasificacion: 'Error', confianza: 0, vecinos: [] };
  }

  const entradaVec = normalizar(entradaObj);

  const conDistancias = dataset.map(muestra => ({
    id: muestra.id,
    clase: muestra.clase,
    distancia: distanciaPonderada(entradaVec, normalizar(muestra), pesos)
  }));

  conDistancias.sort((a, b) => a.distancia - b.distancia);
  const vecinos = conDistancias.slice(0, k);

  const votos = {};
  vecinos.forEach(v => {
    votos[v.clase] = (votos[v.clase] || 0) + 1;
  });

  let clasificacion = 'Normal';
  let maxVotos = 0;
  for (const [cls, cnt] of Object.entries(votos)) {
    if (cnt > maxVotos) {
      maxVotos = cnt;
      clasificacion = cls;
    }
  }

  const confianza = Math.round((maxVotos / Math.max(1, k)) * 100);
  return { clasificacion, confianza, vecinos };
}

const MAP_NOTAS = {
  Normal: 'Perfil glucémico dentro de parámetros normales.',
  Prediabetes: 'Alteración en metabolismo glucémico. Requiere seguimiento.',
  Riesgo: 'Alteración significativa. Se recomienda evaluación clínica.'
};

export async function calcularRiesgoGlucosa(params = {}, preferencias = null) {
  const { validarEntradas } = await import('./validacion.js');

  const pesos = resolverPesos(preferencias);

  const validacion = validarEntradas(params);
  if (!validacion.valido) {
    return {
      clasificacion: 'Error',
      confianza: 0,
      notas: validacion.motivo,
      explicacion: []
    };
  }

  const resultado = clasificarKNN(DATASET, params, 5, pesos);
  const { explicarResultado } = await import('./explicabilidad.js');
  const explicacion = explicarResultado(params, resultado, pesos);

  return {
    clasificacion: resultado.clasificacion,
    confianza: resultado.confianza,
    notas: MAP_NOTAS[resultado.clasificacion] || 'Resultado generado por motor KNN.',
    explicacion
  };
}

export async function orquestarDiagnostico(entradas, preferencias = null) {
  return calcularRiesgoGlucosa(entradas, preferencias);
}

export async function compararPerfiles(perfilA = {}, perfilB = {}, topN = 5, preferencias = null) {
  const valoresA = perfilA.valores || perfilA;
  const valoresB = perfilB.valores || perfilB;
  const pesos = resolverPesos(preferencias);

  const diagA = await calcularRiesgoGlucosa(valoresA, preferencias);
  const diagB = await calcularRiesgoGlucosa(valoresB, preferencias);

  if (diagA.clasificacion === 'Error' || diagB.clasificacion === 'Error') {
    return {
      error: true,
      motivo: diagA.clasificacion === 'Error' ? diagA.notas : diagB.notas,
      a: diagA,
      b: diagB,
      diferencias: []
    };
  }

  const knnA = clasificarKNN(DATASET, valoresA, 5, pesos);
  const knnB = clasificarKNN(DATASET, valoresB, 5, pesos);
  const { explicarResultado } = await import('./explicabilidad.js');
  const explicA = explicarResultado(valoresA, knnA, topN, pesos);
  const explicB = explicarResultado(valoresB, knnB, topN, pesos);

  const diffs = explicA.map((itemA) => {
    const itemB = explicB.find((x) => x.id === itemA.id);
    const valB = itemB ? itemB.valor : null;
    return {
      id: itemA.id,
      nombre: itemA.nombre,
      unidad: itemA.unidad,
      valorA: itemA.valor,
      valorB: valB,
      diferencia: valB === null ? null : Math.round((valB - itemA.valor) * 1000) / 1000
    };
  });

  return {
    error: false,
    a: { id: perfilA.id, paciente: perfilA.paciente, ...diagA },
    b: { id: perfilB.id, paciente: perfilB.paciente, ...diagB },
    diferencias: diffs
  };
}
