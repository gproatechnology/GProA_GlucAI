/**
 * GlucAI 2.0 — Pruebas del motor KNN
 * Ejecutar con: npm test (vitest)
 */

import { describe, it, expect } from 'vitest';
import {
  validarEntradas,
  normalizar,
  distanciaPonderada,
  clasificarKNN,
  calcularRiesgoGlucosa,
  compararPerfiles
} from '../src/js/knn/indice.js';
import { BIOMARCADORES, CLASES } from '../src/js/data/biomarcadores.js';
import { DATASET, STATS } from '../src/js/data/dataset.js';

// Helper: crear objeto con todos los 33 biomarcadores en valores válidos
function crearValoresValidos() {
  const valores = {};
  BIOMARCADORES.forEach(b => {
    valores[b.id] = STATS[b.id].mean;
  });
  return valores;
}

describe('Estructura de datos', () => {
  it('BIOMARCADORES tiene 33 elementos', () => {
    expect(BIOMARCADORES).toHaveLength(33);
  });

  it('CLASES tiene 3 elementos', () => {
    expect(CLASES).toHaveLength(3);
    expect(CLASES).toContain('Normal');
    expect(CLASES).toContain('Prediabetes');
    expect(CLASES).toContain('Riesgo');
  });

  it('DATASET tiene 90 muestras', () => {
    expect(DATASET).toHaveLength(90);
  });

  it('Cada muestra tiene clase válida', () => {
    DATASET.forEach(m => {
      expect(CLASES).toContain(m.clase);
    });
  });

  it('STATS tiene estadísticas para 33 biomarcadores', () => {
    expect(Object.keys(STATS)).toHaveLength(33);
  });

  it('Cada estadística tiene mean y std', () => {
    BIOMARCADORES.forEach(b => {
      expect(STATS[b.id]).toHaveProperty('mean');
      expect(STATS[b.id]).toHaveProperty('std');
    });
  });
});

describe('Validación', () => {
  it('Entrada válida pasa la validación', () => {
    const r = validarEntradas(crearValoresValidos());
    expect(r.valido).toBe(true);
  });

  it('Valor no numérico falla', () => {
    const r = validarEntradas({ glucosa: 'abc' });
    expect(r.valido).toBe(false);
  });

  it('Valor faltante falla', () => {
    const r = validarEntradas({});
    expect(r.valido).toBe(false);
  });

  it('Valor fuera de rango alto falla', () => {
    const r = validarEntradas({ glucosa: 9999 });
    expect(r.valido).toBe(false);
  });

  it('Valor fuera de rango bajo falla', () => {
    const r = validarEntradas({ glucosa: 1 });
    expect(r.valido).toBe(false);
  });
});

describe('Normalización', () => {
  it('Normalización devuelve vector de 33 componentes', () => {
    const muestra = DATASET[0];
    const n = normalizar(muestra);
    expect(n).toHaveLength(33);
  });

  it('Normalización de valores en la media devuelve 0', () => {
    const valores = {};
    BIOMARCADORES.forEach(b => { valores[b.id] = STATS[b.id].mean; });
    const n = normalizar(valores);
    n.forEach(z => {
      expect(z).toBe(0);
    });
  });
});

describe('Distancia', () => {
  it('Distancia entre vectores idénticos es 0', () => {
    const v = [1, 2, 3, 4, 5];
    expect(distanciaPonderada(v, v)).toBe(0);
  });

  it('Distancia entre vectores diferentes es positiva', () => {
    const d = distanciaPonderada([1, 2, 3], [4, 5, 6]);
    expect(d).toBeGreaterThan(0);
  });

  it('Distancia con pesos funciona', () => {
    const d1 = distanciaPonderada([10, 0], [0, 10], [1, 1]);
    const d2 = distanciaPonderada([10, 0], [0, 10], [10, 1]);
    expect(d1).not.toBe(d2);
  });
});

describe('Clasificación KNN', () => {
  it('Clasificación devuelve clase válida', () => {
    const muestra = DATASET[0];
    const r = clasificarKNN(DATASET, muestra, 5);
    expect(CLASES).toContain(r.clasificacion);
  });

  it('Confianza está entre 0 y 100', () => {
    const muestra = DATASET[0];
    const r = clasificarKNN(DATASET, muestra, 5);
    expect(r.confianza).toBeGreaterThanOrEqual(0);
    expect(r.confianza).toBeLessThanOrEqual(100);
  });

  it('Vecinos devueltos son k o menos', () => {
    const muestra = DATASET[0];
    const r = clasificarKNN(DATASET, muestra, 5);
    expect(r.vecinos.length).toBeLessThanOrEqual(5);
  });

  it('Vecinos ordenados por distancia ascendente', () => {
    const muestra = DATASET[0];
    const r = clasificarKNN(DATASET, muestra, 5);
    for (let i = 1; i < r.vecinos.length; i++) {
      expect(r.vecinos[i - 1].distancia).toBeLessThanOrEqual(r.vecinos[i].distancia);
    }
  });

  it('Clasificación de muestra propia es su propia clase (k=1)', () => {
    const muestra = DATASET[0];
    const r = clasificarKNN(DATASET, muestra, 1);
    expect(r.clasificacion).toBe(muestra.clase);
  });
});

describe('Cálculo completo', () => {
  it('calcularRiesgoGlucosa devuelve estructura válida', async () => {
    const muestra = DATASET[0];
    const r = await calcularRiesgoGlucosa(muestra);
    expect(['Normal', 'Prediabetes', 'Riesgo', 'Error']).toContain(r.clasificacion);
    expect(typeof r.confianza).toBe('number');
    expect(typeof r.notas).toBe('string');
    expect(Array.isArray(r.explicacion)).toBe(true);
  });

  it('calcularRiesgoGlucosa con entrada inválida devuelve Error', async () => {
    const r = await calcularRiesgoGlucosa({ glucosa: 'abc' });
    expect(r.clasificacion).toBe('Error');
  });
});

describe('Comparador de perfiles', () => {
  it('compararPerfiles devuelve estructura válida', async () => {
    const a = DATASET[0];
    const b = DATASET[30];
    const r = await compararPerfiles({ valores: a }, { valores: b }, 3);
    expect(r.error).toBe(false);
    expect(r.a.clasificacion).toBeDefined();
    expect(r.b.clasificacion).toBeDefined();
    expect(Array.isArray(r.diferencias)).toBe(true);
  });

  it('compararPerfiles con entrada inválida devuelve error', async () => {
    const r = await compararPerfiles({ valores: { glucosa: 'abc' } }, { valores: DATASET[0] }, 3);
    expect(r.error).toBe(true);
  });
});
