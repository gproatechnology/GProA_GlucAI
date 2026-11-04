/**
 * GlucAI 2.0 — Preferencias de usuario profesional
 * Gestión de configuración persistente en localStorage.
 */

const PREFERENCIAS_KEY = 'glucai_preferencias_v2';

const PREFERENCIAS_POR_DEFECTO = {
  profesional: {
    nombre: '',
    cedula: '',
    institucion: '',
    especialidad: ''
  },
  umbrales: {
    glucosa: { min: 70, max: 140 },
    hba1c: { min: 4.0, max: 6.4 },
    insulina: { min: 2.6, max: 24.9 },
    sodio: { min: 135, max: 145 },
    potasio: { min: 3.5, max: 5.0 },
    cloro: { min: 96, max: 106 },
    calcio: { min: 8.5, max: 10.5 },
    magnesio: { min: 1.7, max: 2.2 },
    fosforo: { min: 2.5, max: 4.5 },
    bun: { min: 7, max: 20 },
    creatinina: { min: 0.6, max: 1.2 },
    egfr: { min: 60, max: 120 },
    alt: { min: 7, max: 56 },
    ast: { min: 10, max: 40 },
    alp: { min: 44, max: 147 },
    bilirrubina: { min: 0.1, max: 1.2 },
    proteina_total: { min: 6.0, max: 8.3 },
    albumina: { min: 3.4, max: 5.4 },
    colesterol: { min: 0, max: 200 },
    trigliceridos: { min: 0, max: 150 },
    hdl: { min: 40, max: 60 },
    ldl: { min: 0, max: 100 },
    pcr: { min: 0, max: 10 },
    ferritina: { min: 24, max: 336 },
    tsh: { min: 0.4, max: 4.0 },
    t4: { min: 4.5, max: 11.2 },
    acido_urico: { min: 3.4, max: 7.0 },
    ldh: { min: 122, max: 222 },
    cpk: { min: 39, max: 308 },
    amilasa: { min: 30, max: 110 },
    lipasa: { min: 0, max: 160 },
    ggt: { min: 9, max: 48 },
    homocisteina: { min: 4.3, max: 17.1 }
  },
  pesos: {
    glucosa: 1.0,
    hba1c: 1.0,
    insulina: 0.8,
    sodio: 0.5,
    potasio: 0.5,
    cloro: 0.5,
    calcio: 0.5,
    magnesio: 0.5,
    fosforo: 0.5,
    bun: 0.6,
    creatinina: 0.6,
    egfr: 0.6,
    alt: 0.5,
    ast: 0.5,
    alp: 0.5,
    bilirrubina: 0.5,
    proteina_total: 0.5,
    albumina: 0.5,
    colesterol: 0.7,
    trigliceridos: 0.7,
    hdl: 0.7,
    ldl: 0.7,
    pcr: 0.6,
    ferritina: 0.5,
    tsh: 0.5,
    t4: 0.5,
    acido_urico: 0.5,
    ldh: 0.5,
    cpk: 0.5,
    amilasa: 0.5,
    lipasa: 0.5,
    ggt: 0.5,
    homocisteina: 0.6
  },
  ui: {
    tema: 'oscuro',
    mostrarHistorial: true,
    idioma: 'es',
    exportarCSV: true,
    autoGuardarDiagnostico: false
  }
};

/**
 * Cargar preferencias desde localStorage
 */
export function cargarPreferencias() {
  try {
    const raw = localStorage.getItem(PREFERENCIAS_KEY);
    if (!raw) return { ...PREFERENCIAS_POR_DEFECTO };

    const guardadas = JSON.parse(raw);
    // Fusionar con defaults para asegurar campos nuevos
    return {
      profesional: { ...PREFERENCIAS_POR_DEFECTO.profesional, ...guardadas.profesional },
      umbrales: { ...PREFERENCIAS_POR_DEFECTO.umbrales, ...guardadas.umbrales },
      pesos: { ...PREFERENCIAS_POR_DEFECTO.pesos, ...guardadas.pesos },
      ui: { ...PREFERENCIAS_POR_DEFECTO.ui, ...guardadas.ui }
    };
  } catch (e) {
    console.error('Error cargando preferencias:', e);
    return { ...PREFERENCIAS_POR_DEFECTO };
  }
}

/**
 * Guardar preferencias en localStorage
 */
export function guardarPreferencias(preferencias) {
  try {
    localStorage.setItem(PREFERENCIAS_KEY, JSON.stringify(preferencias));
    return true;
  } catch (e) {
    console.error('Error guardando preferencias:', e);
    return false;
  }
}

/**
 * Restablecer a valores de fábrica
 */
export function restablecerPreferencias() {
  localStorage.removeItem(PREFERENCIAS_KEY);
  return { ...PREFERENCIAS_POR_DEFECTO };
}

/**
 * Obtener peso de un biomarcador específico
 */
export function obtenerPeso(preferencias, idBiomarcador) {
  return preferencias.pesos[idBiomarcador] ?? 1.0;
}

/**
 * Obtener umbrales de un biomarcador específico
 */
export function obtenerUmbrales(preferencias, idBiomarcador) {
  return preferencias.umbrales[idBiomarcador] ?? { min: 0, max: Infinity };
}
