/**
 * GlucAI 2.0 — UI: Resultado del diagnóstico
 */

const seccionResultado = document.getElementById('resultado-section');
const badgeClase = document.getElementById('badge-clase');
const valorConfianza = document.getElementById('valor-confianza');
const rellenoConfianza = document.getElementById('relleno-confianza');
const textoNotas = document.getElementById('texto-notas');
const listaExplicacion = document.getElementById('lista-explicacion');

const btnNuevo = document.getElementById('btn-nuevo-diagnostico');
const btnGuardar = document.getElementById('btn-guardar-historial');
const btnExportar = document.getElementById('btn-exportar-json');
const btnExportarCSV = document.getElementById('btn-exportar-csv');

let resultadoActual = null;
let valoresActuales = null;

function mostrarResultado(resultado, valores) {
    resultadoActual = resultado;
    valoresActuales = valores;

    if (!seccionResultado) return;
    seccionResultado.classList.remove('hidden');

    // Clase
    badgeClase.textContent = resultado.clasificacion;
    badgeClase.className = `clase-badge ${resultado.clasificacion.toLowerCase()}`;

    // Confianza
    valorConfianza.textContent = `${resultado.confianza}%`;
    rellenoConfianza.style.width = `${resultado.confianza}%`;

    // Notas
    textoNotas.textContent = resultado.notas;

    // Explicación
    if (listaExplicacion) {
        listaExplicacion.innerHTML = '';
        (resultado.explicacion || []).forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${item.nombre} (${item.unidad}): ${item.valor}</span>
                <span class="valor-diff">${item.diff}</span>
            `;
            listaExplicacion.appendChild(li);
        });
    }

    // Scroll al resultado
    seccionResultado.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function ocultarResultado() {
    if (seccionResultado) seccionResultado.classList.add('hidden');
    resultadoActual = null;
    valoresActuales = null;
}

if (btnNuevo) {
    btnNuevo.addEventListener('click', ocultarResultado);
}

if (btnGuardar) {
    btnGuardar.addEventListener('click', () => {
        if (!resultadoActual || !valoresActuales) return;
        const { guardarEnHistorial } = await import('./historial.js');
        const entrada = {
            id: Date.now(),
            fecha: new Date().toISOString(),
            valores: valoresActuales,
            resultado: resultadoActual
        };
        guardarEnHistorial(entrada);
        mostrarToast('Guardado en historial');
    });
}

if (btnExportar) {
    btnExportar.addEventListener('click', () => {
        if (!resultadoActual || !valoresActuales) return;
        const exportar = {
            fecha: new Date().toISOString(),
            valores: valoresActuales,
            resultado: resultadoActual
        };
        const blob = new Blob([JSON.stringify(exportar, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `glucai-diagnostico-${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}

async function exportarCSV(valores, resultado) {
    const filas = [];
    const encabezados = ['biomarcador', 'valor', 'unidad', 'clase', 'confianza', 'notas', 'fecha'];
    filas.push(encabezados.join(','));

    const fecha = new Date().toISOString();
    const { BIOMARCADORES } = await import('../data/biomarcadores.js');

    BIOMARCADORES.forEach(b => {
        const v = valores[b.id] ?? '';
        filas.push([b.id, v, b.unidad, resultado.clasificacion, resultado.confianza, resultado.notas, fecha].join(','));
    });

    const csv = filas.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `glucai-diagnostico-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

if (btnExportarCSV) {
    btnExportarCSV.addEventListener('click', () => {
        if (!resultadoActual || !valoresActuales) return;
        exportarCSV(valoresActuales, resultadoActual);
    });
}

export { mostrarResultado, ocultarResultado };
