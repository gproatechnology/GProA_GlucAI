/**
 * GlucAI 2.0 — UI: Historial (localStorage)
 */

const HISTORIAL_KEY = 'glucai_historial_v2';

const contenedorHistorial = document.getElementById('lista-historial');

export function guardarEnHistorial(entrada) {
  const historial = obtenerHistorial();
  historial.unshift(entrada);
  const recortado = historial.slice(0, 50);
  localStorage.setItem(HISTORIAL_KEY, JSON.stringify(recortado));
  renderizarHistorial();
}

export function obtenerHistorial() {
  try {
    const raw = localStorage.getItem(HISTORIAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function eliminarDelHistorial(id) {
  const historial = obtenerHistorial().filter(e => e.id !== id);
  localStorage.setItem(HISTORIAL_KEY, JSON.stringify(historial));
  renderizarHistorial();
}

export function renderizarHistorial() {
  if (!contenedorHistorial) return;

  const historial = obtenerHistorial();

  if (historial.length === 0) {
    contenedorHistorial.innerHTML = '<p class="vacia">No hay diagnósticos guardados.</p>';
    return;
  }

  contenedorHistorial.innerHTML = historial.map(entrada => {
    const fecha = new Date(entrada.fecha).toLocaleString('es-ES');
    return `
      <div class="item-historial" data-id="${entrada.id}">
        <div>
          <div class="clase">${entrada.resultado.clasificacion}</div>
          <div style="font-size:0.85rem; color:var(--gray);">${entrada.resultado.notas}</div>
          <div class="fecha">${fecha}</div>
        </div>
        <button class="btn-outline" onclick="eliminarDelHistorial(${entrada.id})" style="padding:6px 12px; font-size:0.8rem;">Eliminar</button>
      </div>
    `;
  }).join('');
}

window.eliminarDelHistorial = eliminarDelHistorial;
