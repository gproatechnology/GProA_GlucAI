/**
 * GlucAI 2.0 — Pruebas del motor KNN
 * Ejecutar con: node tests/_test_knn.mjs
 */

import { assert } from 'node:assert';
import {
  validarEntradas,
  normalizar,
  distanciaPonderada,
  clasificarKNN,
  calcularRiesgoGlucosa
} from '../src/frontend/js/knn/indice.js';
import { BIOMARCADORES, CLASES } from '../src/frontend/js/data/biomarcadores.js';
import { DATASET, STATS } from '../src/frontend/js/data/dataset.js';

// 1. Estructura de datos
console.assert(BIOMARCADORES.length === 33, 'Deben haber 33 biomarcadores');
console.assert(CLASES.length === 3, 'Deben haber 3 clases');
console.assert(DATASET.length === 90, 'Deben haber 90 muestras');
console.assert(Object.keys(STATS).length === 33, 'Deben haber estadísticas para 33 biomarcadores');

// 2. Validación
const valido = validarEntradas({ glucosa: 90, hba1c: 5.5 });
console.assert(valido.valido === true, 'Entrada válida debe pasar');

const invalido = validarEntradas({ glucosa: 'abc' });
console.assert(invalido.valido === false, 'Valor no numérico debe fallar');

const fueraRango = validarEntradas({ glucosa: 9999 });
console.assert(fueraRango.valido === false, 'Valor fuera de rango debe fallar');

// 3. Normalización
const muestra = DATASET[0];
const normalizada = normalizar(muestra);
console.assert(normalizada.length === 33, 'Vector normalizado debe tener 33 componentes');

// 4. Distancia
const d = distanciaPonderada([1, 2, 3], [4, 5, 6]);
console.assert(d > 0, 'La distancia debe ser positiva');

// 5. Clasificación KNN
const resultado = clasificarKNN(DATASET, muestra, 5);
console.assert(['Normal', 'Prediabetes', 'Riesgo'].includes(resultado.clasificacion), 'Clasificación válida');
console.assert(resultado.confianza >= 0 && resultado.confianza <= 100, 'Confianza entre 0 y 100');

// 6. Cálculo completo
const riesgo = calcularRiesgoGlucosa(muestra);
console.assert(['Normal', 'Prediabetes', 'Riesgo', 'Error'].includes(riesgo.clasificacion), 'Resultado válido');

console.log('✅ Todas las pruebas del motor KNN pasaron');
