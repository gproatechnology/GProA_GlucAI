/**
 * GlucAI 2.0 — main.js
 * Punto de entrada de la aplicación. Conecta UI con el motor KNN.
 */

import { calcularRiesgoGlucosa } from './knn/indice.js';
import { renderizarCampos, obtenerValores } from './ui/formulario.js';
import { mostrarResultado, ocultarResultado } from './ui/resultado.js';
import { renderizarHistorial } from './ui/historial.js';
import { abrirPanelConfiguracion, cerrarPanelConfiguracion, obtenerPreferenciasActuales, aplicarTema } from './config/config-panel.js';
import { cargarPreferencias } from './config/preferencias.js';

let preferenciasActuales = null;

document.addEventListener('DOMContentLoaded', async () => {
  console.log('GlucAI 2.0 inicializado');

  // Cargar preferencias y aplicar tema
  preferenciasActuales = cargarPreferencias();
  aplicarTema(preferenciasActuales.ui.tema);

  renderizarCampos();
  renderizarHistorial();

  // Botón de configuración
  const btnConfig = document.getElementById('btn-configuracion');
  const btnCerrarConfig = document.getElementById('btn-cerrar-config');

  if (btnConfig) {
    btnConfig.addEventListener('click', () => {
      abrirPanelConfiguracion();
    });
  }

  if (btnCerrarConfig) {
    btnCerrarConfig.addEventListener('click', () => {
      cerrarPanelConfiguracion();
      // Recargar preferencias después de cerrar
      preferenciasActuales = obtenerPreferenciasActuales() || cargarPreferencias();
    });
  }

  // Cerrar modal al hacer clic fuera
  const modal = document.getElementById('panel-configuracion');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        cerrarPanelConfiguracion();
        preferenciasActuales = obtenerPreferenciasActuales() || cargarPreferencias();
      }
    });
  }

  window.addEventListener('diagnosticar-solicitado', async (e) => {
    const valores = e.detail;
    const resultado = await calcularRiesgoGlucosa(valores, preferenciasActuales);
    mostrarResultado(resultado, valores);
  });
});
