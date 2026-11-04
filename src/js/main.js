/**
 * GlucAI 2.0 — main.js
 * Punto de entrada de la aplicación. Conecta UI con el motor KNN.
 */

import { calcularRiesgoGlucosa } from './knn/indice.js';
import { renderizarCampos, obtenerValores } from './ui/formulario.js';
import { mostrarResultado, ocultarResultado } from './ui/resultado.js';
import { renderizarHistorial } from './ui/historial.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('GlucAI 2.0 inicializado');

  renderizarCampos();
  renderizarHistorial();

  window.addEventListener('diagnosticar-solicitado', (e) => {
    const valores = e.detail;
    const resultado = calcularRiesgoGlucosa(valores);
    mostrarResultado(resultado, valores);
  });
});
