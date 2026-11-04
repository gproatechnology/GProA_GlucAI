/**
 * GlucAI 2.0 — Índice del motor KNN
 * Punto de entrada único para consumir el motor desde la UI.
 */

export { validarEntradas } from './validacion.js';
export { normalizar } from './normalizacion.js';
export { distanciaPonderada } from './distancia.js';
export { clasificarKNN, calcularRiesgoGlucosa, orquestarDiagnostico, compararPerfiles } from './clasificador.js';
export { explicarResultado } from './explicabilidad.js';
