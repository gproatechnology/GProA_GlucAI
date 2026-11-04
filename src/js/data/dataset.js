/**
 * GlucAI 2.0 — Dataset sintético de entrenamiento
 * 90 muestras: 30 Normal / 30 Prediabetes / 30 Riesgo
 * Generado con distribuciones normales por clase.
 */

import { BIOMARCADORES, CLASES } from './biomarcadores.js';

function generarDataset() {
  let seed = 12345;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const randn = (mean, std) => {
    const u1 = random() || 1e-10;
    const u2 = random();
    return mean + std * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };

  const CONFIG = {
    glucosa: [85, 8, 115, 10, 155, 15],
    hba1c: [5.2, 0.3, 5.9, 0.4, 7.2, 0.6],
    insulina: [10, 3, 18, 5, 6, 3],
    sodio: [140, 3, 139, 3, 141, 4],
    potasio: [4.0, 0.3, 4.1, 0.3, 4.3, 0.4],
    cloro: [102, 3, 101, 3, 100, 4],
    calcio: [9.2, 0.4, 9.1, 0.4, 9.0, 0.5],
    magnesio: [2.0, 0.2, 1.9, 0.2, 1.8, 0.3],
    fosforo: [3.5, 0.4, 3.4, 0.4, 3.2, 0.5],
    bun: [15, 4, 16, 4, 20, 6],
    creatinina: [0.9, 0.2, 1.0, 0.2, 1.3, 0.4],
    egfr: [95, 10, 90, 10, 75, 15],
    alt: [25, 8, 30, 10, 40, 15],
    ast: [22, 7, 26, 8, 35, 12],
    alp: [70, 20, 75, 20, 85, 25],
    bilirrubina: [0.7, 0.2, 0.8, 0.2, 1.0, 0.3],
    proteina_total: [7.0, 0.4, 6.9, 0.4, 6.7, 0.5],
    albumina: [4.2, 0.3, 4.1, 0.3, 3.9, 0.4],
    colesterol: [180, 25, 200, 30, 220, 35],
    trigliceridos: [120, 30, 160, 40, 220, 50],
    hdl: [55, 10, 45, 10, 38, 8],
    ldl: [100, 20, 120, 25, 140, 30],
    pcr: [2.0, 1.0, 3.5, 1.5, 5.0, 2.0],
    ferritina: [100, 40, 110, 45, 130, 50],
    tsh: [2.0, 1.0, 2.5, 1.2, 3.0, 1.5],
    t4: [8.0, 1.5, 7.5, 1.5, 7.0, 1.5],
    acido_urico: [5.5, 1.2, 6.0, 1.3, 7.0, 1.5],
    ldh: [160, 40, 170, 45, 190, 50],
    cpk: [100, 30, 110, 35, 130, 40],
    amilasa: [50, 15, 55, 18, 60, 20],
    lipasa: [40, 12, 45, 15, 50, 18],
    ggt: [30, 10, 35, 12, 45, 15],
    homocisteina: [10, 3, 12, 4, 15, 5]
  };

  const dataset = [];
  for (const clase of CLASES) {
    for (let i = 0; i < 30; i++) {
      const muestra = { id: `${clase}_${i}`, clase };
      for (const b of BIOMARCADORES) {
        const [nm, ns, pm, ps, rm, rs] = CONFIG[b.id];
        const mean = clase === 'Normal' ? nm : clase === 'Prediabetes' ? pm : rm;
        const std = clase === 'Normal' ? ns : clase === 'Prediabetes' ? ps : rs;
        muestra[b.id] = Math.round(randn(mean, std) * 100) / 100;
      }
      dataset.push(muestra);
    }
  }
  return dataset;
}

export const DATASET = generarDataset();

export function estadisticasDataset() {
  const stats = {};
  for (const b of BIOMARCADORES) {
    const valores = DATASET.map(m => m[b.id]);
    const mean = valores.reduce((a, v) => a + v, 0) / valores.length;
    const std = Math.sqrt(valores.reduce((a, v) => a + (v - mean) ** 2, 0) / valores.length);
    stats[b.id] = { mean: Math.round(mean * 100) / 100, std: Math.round(std * 100) / 100 };
  }
  return stats;
}

export const STATS = estadisticasDataset();
