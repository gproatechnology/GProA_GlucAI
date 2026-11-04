/**
 * GlucAI 2.0 — Distancia euclídea ponderada
 * Calcula la distancia entre dos vectores normalizados con pesos opcionales.
 */

export function distanciaPonderada(a, b, pesos) {
  const n = Math.min(a.length, b.length);
  const hasPesos = Array.isArray(pesos) && pesos.length === n;
  let suma = 0;
  for (let i = 0; i < n; i++) {
    const diff = (a[i] || 0) - (b[i] || 0);
    const peso = hasPesos ? (pesos[i] || 1) : 1;
    suma += (diff * diff) * peso;
  }
  return Math.sqrt(suma);
}
