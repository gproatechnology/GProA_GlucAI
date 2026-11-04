/**
 * GlucAI 2.0 — UI: Formulario de 33 biomarcadores
 */

import { BIOMARCADORES } from '../data/biomarcadores.js';

const contenedor = document.getElementById('campos-biomarcadores');
const btnEjemplo = document.getElementById('btn-cargar-ejemplo');
const btnDiagnosticar = document.getElementById('btn-diagnosticar');

let valores = {};

function renderizarCampos() {
  if (!contenedor) return;

  contenedor.innerHTML = BIOMARCADORES.map(b => `
    <div class="campo" data-id="${b.id}">
      <label for="input-${b.id}">
        ${b.nombre}
        <span class="requerido">*</span>
        <span style="font-size:0.7rem; font-weight:normal; color:var(--gray);">${b.unidad}</span>
      </label>
      <input
        type="number"
        id="input-${b.id}"
        name="${b.id}"
        step="any"
        placeholder="0"
        autocomplete="off"
      >
    </div>
  `).join('');

  document.querySelectorAll('.campo input').forEach(input => {
    input.addEventListener('input', (e) => {
      const id = e.target.name;
      const val = parseFloat(e.target.value);
      if (!isNaN(val)) {
        valores[id] = val;
        input.classList.remove('invalido', 'valido');
        const error = input.parentElement.querySelector('.error-texto');
        if (error) error.remove();
      }
    });
  });
}

function obtenerValores() {
  const resultado = {};
  BIOMARCADORES.forEach(b => {
    const input = document.getElementById(`input-${b.id}`);
    if (input) {
      const val = parseFloat(input.value);
      resultado[b.id] = isNaN(val) ? null : val;
    }
  });
  return resultado;
}

function cargarEjemplo() {
  const ejemplo = {
    glucosa: 90, hba1c: 5.3, insulina: 10, sodio: 140, potasio: 4.0,
    cloro: 102, calcio: 9.2, magnesio: 2.0, fosforo: 3.5, bun: 15,
    creatinina: 0.9, egfr: 95, alt: 25, ast: 22, alp: 70, bilirrubina: 0.7,
    proteina_total: 7.0, albumina: 4.2, colesterol: 180, trigliceridos: 120,
    hdl: 55, ldl: 100, pcr: 2.0, ferritina: 100, tsh: 2.0, t4: 8.0,
    acido_urico: 5.5, ldh: 160, cpk: 100, amilasa: 50, lipasa: 40, ggt: 30,
    homocisteina: 10
  };

  Object.entries(ejemplo).forEach(([id, val]) => {
    const input = document.getElementById(`input-${id}`);
    if (input) {
      input.value = val;
      valores[id] = val;
    }
  });
}

function validarCampos() {
  let valido = true;
  document.querySelectorAll('.campo input').forEach(input => {
    const id = input.name;
    const val = parseFloat(input.value);
    if (isNaN(val)) {
      input.classList.add('invalido');
      input.classList.remove('valido');
      let error = input.parentElement.querySelector('.error-texto');
      if (!error) {
        error = document.createElement('span');
        error.className = 'error-texto';
        input.parentElement.appendChild(error);
      }
      error.textContent = 'Valor requerido';
      valido = false;
    } else {
      input.classList.remove('invalido');
      input.classList.add('valido');
      const error = input.parentElement.querySelector('.error-texto');
      if (error) error.remove();
    }
  });
  return valido;
}

if (btnEjemplo) {
  btnEjemplo.addEventListener('click', cargarEjemplo);
}

if (btnDiagnosticar) {
  btnDiagnosticar.addEventListener('click', (e) => {
    e.preventDefault();
    if (!validarCampos()) {
      mostrarToast('Por favor completa todos los campos correctamente.');
      return;
    }
    const data = obtenerValores();
    window.dispatchEvent(new CustomEvent('diagnosticar-solicitado', { detail: data }));
  });
}

export function mostrarToast(mensaje) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = mensaje;
  toast.classList.add('mostrar');
  setTimeout(() => toast.classList.remove('mostrar'), 4000);
}

export { renderizarCampos, obtenerValores, valores };
