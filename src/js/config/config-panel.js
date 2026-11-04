/**
 * GlucAI 2.0 — Panel de Configuración de Usuario Profesional
 * Modal con pestañas: Perfil, Umbrales, Pesos, UI.
 */

import { cargarPreferencias, guardarPreferencias, restablecerPreferencias, obtenerPeso } from './preferencias.js';
import { BIOMARCADORES } from '../data/biomarcadores.js';

const PANEL_ID = 'panel-configuracion';
const BTN_CONFIG_ID = 'btn-configuracion';
const BTN_CERRAR_CONFIG_ID = 'btn-cerrar-config';
const BTN_GUARDAR_CONFIG_ID = 'btn-guardar-config';
const BTN_RESTABLECER_CONFIG_ID = 'btn-restablecer-config';

let preferenciasActuales = null;

/**
 * Abrir panel de configuración
 */
export function abrirPanelConfiguracion() {
  preferenciasActuales = cargarPreferencias();
  renderizarPanel();
  document.getElementById(PANEL_ID).classList.remove('oculto');
  document.getElementById(PANEL_ID).setAttribute('aria-hidden', 'false');
}

/**
 * Cerrar panel de configuración
 */
export function cerrarPanelConfiguracion() {
  document.getElementById(PANEL_ID).classList.add('oculto');
  document.getElementById(PANEL_ID).setAttribute('aria-hidden', 'true');
}

/**
 * Renderizar el panel completo
 */
function renderizarPanel() {
  const contenedor = document.getElementById('contenido-configuracion');
  if (!contenedor) return;

  contenedor.innerHTML = `
    <div class="config-header">
      <h3><i class="fas fa-cog"></i> Configuración Profesional</h3>
      <div class="config-tabs">
        <button class="config-tab activo" data-tab="perfil">Perfil Profesional</button>
        <button class="config-tab" data-tab="umbrales">Umbrales Clínicos</button>
        <button class="config-tab" data-tab="pesos">Pesos KNN</button>
        <button class="config-tab" data-tab="ui">Interfaz</button>
      </div>
    </div>

    <div class="config-panels">
      <!-- Perfil -->
      <div class="config-panel activo" id="panel-perfil">
        <div class="campo-config">
          <label>Nombre completo</label>
          <input type="text" id="config-nombre" value="${escapeHtml(preferenciasActuales.profesional.nombre)}" placeholder="Dr. Juan Pérez">
        </div>
        <div class="campo-config">
          <label>Cédula / Licencia</label>
          <input type="text" id="config-cedula" value="${escapeHtml(preferenciasActuales.profesional.cedula)}" placeholder="Ej: 12345678">
        </div>
        <div class="campo-config">
          <label>Institución</label>
          <input type="text" id="config-institucion" value="${escapeHtml(preferenciasActuales.profesional.institucion)}" placeholder="Hospital Central">
        </div>
        <div class="campo-config">
          <label>Especialidad</label>
          <input type="text" id="config-especialidad" value="${escapeHtml(preferenciasActuales.profesional.especialidad)}" placeholder="Endocrinología">
        </div>
      </div>

      <!-- Umbrales -->
      <div class="config-panel" id="panel-umbrales">
        <p class="config-subtitulo">Ajusta los rangos de referencia para alertas clínicas</p>
        <div class="umbrales-grid" id="umbrales-grid">
          ${BIOMARCADORES.map(b => `
            <div class="umbral-item">
              <label>${b.nombre} (${b.unidad})</label>
              <div class="umbral-inputs">
                <input type="number" id="umbral-min-${b.id}" value="${preferenciasActuales.umbrales[b.id].min}" step="any" placeholder="mín">
                <input type="number" id="umbral-max-${b.id}" value="${preferenciasActuales.umbrales[b.id].max}" step="any" placeholder="máx">
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Pesos KNN -->
      <div class="config-panel" id="panel-pesos">
        <p class="config-subtitulo">Ajusta la importancia de cada biomarcador en el motor KNN (0 a 2)</p>
        <div class="pesos-grid" id="pesos-grid">
          ${BIOMARCADORES.map(b => `
            <div class="peso-item">
              <label>${b.nombre}</label>
              <input type="number" id="peso-${b.id}" value="${preferenciasActuales.pesos[b.id]}" min="0" max="2" step="0.1">
            </div>
          `).join('')}
        </div>
      </div>

      <!-- UI -->
      <div class="config-panel" id="panel-ui">
        <div class="campo-config">
          <label>Tema visual</label>
          <select id="config-tema">
            <option value="oscuro" ${preferenciasActuales.ui.tema === 'oscuro' ? 'selected' : ''}>Oscuro</option>
            <option value="claro" ${preferenciasActuales.ui.tema === 'claro' ? 'selected' : ''}>Claro</option>
          </select>
        </div>
        <div class="campo-config checkbox">
          <input type="checkbox" id="config-mostrar-historial" ${preferenciasActuales.ui.mostrarHistorial ? 'checked' : ''}>
          <label>Mostrar historial de diagnósticos</label>
        </div>
        <div class="campo-config checkbox">
          <input type="checkbox" id="config-auto-guardar" ${preferenciasActuales.ui.autoGuardarDiagnostico ? 'checked' : ''}>
          <label>Auto-guardar diagnóstico en historial</label>
        </div>
        <div class="campo-config">
          <label>Idioma</label>
          <select id="config-idioma">
            <option value="es" ${preferenciasActuales.ui.idioma === 'es' ? 'selected' : ''}>Español</option>
            <option value="en" ${preferenciasActuales.ui.idioma === 'en' ? 'selected' : ''}>Inglés</option>
          </select>
        </div>
      </div>
    </div>

    <div class="config-actions">
      <button class="btn btn-outline" id="${BTN_RESTABLECER_CONFIG_ID}">Restablecer valores de fábrica</button>
      <button class="btn btn-primary" id="${BTN_GUARDAR_CONFIG_ID}">Guardar configuración</button>
    </div>
  `;

  // Conectar pestañas
  document.querySelectorAll('.config-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.config-tab').forEach(t => t.classList.remove('activo'));
      tab.classList.add('activo');

      document.querySelectorAll('.config-panel').forEach(p => p.classList.remove('activo'));
      const panelId = 'panel-' + tab.dataset.tab;
      document.getElementById(panelId).classList.add('activo');
    });
  });

  // Conectar botones
  document.getElementById(BTN_GUARDAR_CONFIG_ID).addEventListener('click', guardarConfiguracion);
  document.getElementById(BTN_RESTABLECER_CONFIG_ID).addEventListener('click', restablecerConfiguracion);
}

/**
 * Guardar configuración desde el panel
 */
function guardarConfiguracion() {
  // Perfil
  preferenciasActuales.profesional = {
    nombre: document.getElementById('config-nombre').value,
    cedula: document.getElementById('config-cedula').value,
    institucion: document.getElementById('config-institucion').value,
    especialidad: document.getElementById('config-especialidad').value
  };

  // Umbrales
  BIOMARCADORES.forEach(b => {
    const min = parseFloat(document.getElementById(`umbral-min-${b.id}`).value);
    const max = parseFloat(document.getElementById(`umbral-max-${b.id}`).value);
    if (!isNaN(min) && !isNaN(max)) {
      preferenciasActuales.umbrales[b.id] = { min, max };
    }
  });

  // Pesos
  BIOMARCADORES.forEach(b => {
    const peso = parseFloat(document.getElementById(`peso-${b.id}`).value);
    if (!isNaN(peso)) {
      preferenciasActuales.pesos[b.id] = peso;
    }
  });

  // UI
  preferenciasActuales.ui = {
    tema: document.getElementById('config-tema').value,
    mostrarHistorial: document.getElementById('config-mostrar-historial').checked,
    idioma: document.getElementById('config-idioma').value,
    exportarCSV: true,
    autoGuardarDiagnostico: document.getElementById('config-auto-guardar').checked
  };

  const exito = guardarPreferencias(preferenciasActuales);
  if (exito) {
    mostrarToast('Configuración guardada correctamente');
    // Aplicar tema inmediatamente
    aplicarTema(preferenciasActuales.ui.tema);
  } else {
    mostrarToast('Error al guardar configuración');
  }
}

/**
 * Restablecer valores de fábrica
 */
function restablecerConfiguracion() {
  if (!confirm('¿Estás seguro de restablecer todos los valores a fábrica?')) return;
  preferenciasActuales = restablecerPreferencias();
  renderizarPanel();
  aplicarTema(preferenciasActuales.ui.tema);
  mostrarToast('Configuración restablecida');
}

/**
 * Aplicar tema al documento (exportado para main.js)
 */
export function aplicarTema(tema) {
  if (tema === 'claro') {
    document.documentElement.setAttribute('data-tema', 'claro');
  } else {
    document.documentElement.removeAttribute('data-tema');
  }
}

/**
 * Obtener las preferencias actuales (para uso en otros módulos)
 */
export function obtenerPreferenciasActuales() {
  return preferenciasActuales;
}

/**
 * Escapar HTML para prevenir XSS
 */
function escapeHtml(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

/**
 * Mostrar toast (delegado a resultado.js si existe, o local)
 */
export function mostrarToast(mensaje) {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = mensaje;
    toast.classList.add('mostrar');
    setTimeout(() => toast.classList.remove('mostrar'), 3000);
  }
}
