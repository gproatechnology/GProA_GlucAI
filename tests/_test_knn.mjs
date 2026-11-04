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
  calcularRiesgoGlucosa,
  compararPerfiles
} from '../src/frontend/js/knn/indice.js';
import { BIOMARCADORES, CLASES } from '../src/frontend/js/data/biomarcadores.js';
import { DATASET, STATS } from '../src/frontend/js/data/dataset.js';

let passed = 0;
let failed = 0;

function test(nombre, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${nombre}`);
  } catch (e) {
    failed++;
    console.error(`  ❌ ${nombre}: ${e.message}`);
  }
}

function assertEqual(actual, esperado, mensaje) {
  assert.deepStrictEqual(actual, esperado, mensaje);
}

function assertTrue(valor, mensaje) {
  assert.ok(valor, mensaje);
}

function assertFalse(valor, mensaje) {
  assert.ok(!valor, mensaje);
}

// ── 1. Estructura de datos ──
test('BIOMARCADORES tiene 33 elementos', () => {
  assertEqual(BIOMARCADORES.length, 33, 'Deben ser 33 biomarcadores');
});

test('CLASES tiene 3 elementos', () => {
  assertEqual(CLASES.length, 3, 'Deben ser 3 clases');
  assertTrue(CLASES.includes('Normal'));
  assertTrue(CLASES.includes('Prediabetes'));
  assertTrue(CLASES.includes('Riesgo'));
});

test('DATASET tiene 90 muestras', () => {
  assertEqual(DATASET.length, 90, 'Deben ser 90 muestras');
});

test('Cada muestra tiene clase válida', () => {
  DATASET.forEach(m => {
    assertTrue(CLASES.includes(m.clase), `Muestra ${m.id} con clase inválida: ${m.clase}`);
  });
});

test('STATS tiene estadísticas para 33 biomarcadores', () => {
  assertEqual(Object.keys(STATS).length, 33, 'Deben haber estadísticas para 33 biomarcadores');
});

test('Cada estadística tiene mean y std', () => {
  BIOMARCADORES.forEach(b => {
    assertTrue('mean' in STATS[b.id], `${b.id} debe tener mean`);
    assertTrue('std' in STATS[b.id], `${b.id} debe tener std`);
  });
});

// ── 2. Validación ──
test('Entrada válida pasa la validación', () => {
  const r = validarEntradas({ glucosa: 90, hba1c: 5.5 });
  assertTrue(r.valido, 'Entrada válida debe pasar');
});

test('Valor no numérico falla', () => {
  const r = validarEntradas({ glucosa: 'abc' });
  assertFalse(r.valido, 'Valor no numérico debe fallar');
});

test('Valor faltante falla', () => {
  const r = validarEntradas({});
  assertFalse(r.valido, 'Entrada vacía debe fallar');
});

test('Valor fuera de rango alto falla', () => {
  const r = validarEntradas({ glucosa: 9999 });
  assertFalse(r.valido, 'Glucosa 9999 debe fallar');
});

test('Valor fuera de rango bajo falla', () => {
  const r = validarEntradas({ glucosa: 1 });
  assertFalse(r.valido, 'Glucosa 1 debe fallar');
});

test('Todos los campos requeridos detectan vacíos', () => {
  const r = validarEntradas({});
  assertFalse(r.valido, 'Entrada completamente vacía debe fallar');
});

// ── 3. Normalización ──
test('Normalización devuelve vector de 33 componentes', () => {
  const muestra = DATASET[0];
  const n = normalizar(muestra);
  assertEqual(n.length, 33, 'Vector normalizado debe tener 33 componentes');
});

test('Normalización de valores constantes devuelve 0', () => {
  const valores = {};
  BIOMARCADORES.forEach(b => { valores[b.id] = STATS[b.id].mean; });
  const n = normalizar(valores);
  n.forEach(z => {
    assertEqual(z, 0, `Valor en la media debe normalizar a 0, obtuvo ${z}`);
  });
});

// ── 4. Distancia ──
test('Distancia entre vectores idénticos es 0', () => {
  const v = [1, 2, 3, 4, 5];
  assertEqual(distanciaPonderada(v, v), 0, 'Distancia idéntica debe ser 0');
});

test('Distancia entre vectores diferentes es positiva', () => {
  const d = distanciaPonderada([1, 2, 3], [4, 5, 6]);
  assertTrue(d > 0, 'Distancia diferente debe ser positiva');
});

test('Distancia con pesos funciona', () => {
  const d1 = distanciaPonderada([1, 2], [4, 6], [1, 1]);
  const d2 = distanciaPonderada([1, 2], [4, 6], [0, 1]);
  assertTrue(d1 !== d2, 'Pesos diferentes deben producir distancias diferentes');
});

// ── 5. Clasificación KNN ──
test('Clasificación devuelve clase válida', () => {
  const muestra = DATASET[0];
  const r = clasificarKNN(DATASET, muestra, 5);
  assertTrue(CLASES.includes(r.clasificacion), `Clasificación inválida: ${r.clasificacion}`);
});

test('Confianza está entre 0 y 100', () => {
  const muestra = DATASET[0];
  const r = clasificarKNN(DATASET, muestra, 5);
  assertTrue(r.confianza >= 0 && r.confianza <= 100, `Confianza fuera de rango: ${r.confianza}`);
});

test('Vecinos devueltos son k o menos', () => {
  const muestra = DATASET[0];
  const r = clasificarKNN(DATASET, muestra, 5);
  assertTrue(r.vecinos.length <= 5, `Demasiados vecinos: ${r.vecinos.length}`);
});

test('Vecinos ordenados por distancia ascendente', () => {
  const muestra = DATASET[0];
  const r = clasificarKNN(DATASET, muestra, 5);
  for (let i = 1; i < r.vecinos.length; i++) {
    assertTrue(r.vecinos[i-1].distancia <= r.vecinos[i].distancia, 'Vecinos no ordenados');
  });
});

test('Clasificación de muestra propia es su propia clase', () => {
  // Una muestra propia debería clasificarse como su clase (vecino más cercano es ella misma)
  const muestra = DATASET[0];
  const r = clasificarKNN(DATASET, muestra, 1);
  assertEqual(r.clasificacion, muestra.clase, `Esperaba ${muestra.clase}, obtuvo ${r.clasificacion}`);
});

// ── 6. Cálculo completo ──
test('calcularRiesgoGlucosa devuelve estructura válida', () => {
  const muestra = DATASET[0];
  const r = calcularRiesgoGlucosa(muestra);
  assertTrue(['Normal', 'Prediabetes', 'Riesgo', 'Error'].includes(r.clasificacion), `Clasificación inválida: ${r.clasificacion}`);
  assertTrue(typeof r.confianza === 'number', 'Confianza debe ser número');
  assertTrue(typeof r.notas === 'string', 'Notas debe ser string');
  assertTrue(Array.isArray(r.explicacion), 'Explicación debe ser array');
});

test('calcularRiesgoGlucosa con entrada inválida devuelve Error', () => {
  const r = calcularRiesgoGlucosa({ glucosa: 'abc' });
  assertEqual(r.clasificacion, 'Error', 'Entrada inválida debe devolver Error');
});

// ── 7. Comparador de perfiles ──
test('compararPerfiles devuelve estructura válida', () => {
  const a = DATASET[0];
  const b = DATASET[30];
  const r = compararPerfiles({ valores: a }, { valores: b }, 3);
  assertFalse(r.error, 'No debería haber error');
  assertTrue(r.a.clasificacion, 'Perfil A debe tener clasificación');
  assertTrue(r.b.clasificacion, 'Perfil B debe tener clasificación');
  assertTrue(Array.isArray(r.diferencias), 'Diferencias debe ser array');
});

test('compararPerfiles con entrada inválida devuelve error', () => {
  const r = compararPerfiles({ valores: { glucosa: 'abc' } }, { valores: DATASET[0] }, 3);
  assertTrue(r.error, 'Entrada inválida debe devolver error');
});

// ── Resumen ──
console.log(`\n📊 Resultados: ${passed} pasaron, ${failed} fallaron`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('✅ Todas las pruebas del motor KNN pasaron');
}
