// script-reporte_v3.js (Migración a Firestore)
// Basado en script-reporte.js (original)

// ----------------------------------------------------
// -- CONFIGURACIÓN DE FIREBASE (DEBE SER LA MISMA QUE EN EL FORMULARIO) --
// ----------------------------------------------------
const firebaseConfig = {
    apiKey: "AIzaSyCpTq5L2oTJW7Mv9k3skFBPXxs9yixXsH4",
    authDomain: "monitoreo-cermaq.firebaseapp.com",
    projectId: "monitoreo-cermaq",
    databaseURL: "https://monitoreo-cermaq-default-rtdb.firebaseio.com",
    storageBucket: "monitoreo-cermaq.firebasestorage.app",
    messagingSenderId: "25042542775",
    appId: "1:25042542775:web:0527629e71676651186d32",
    measurementId: "G-1K8E936SLQ"
};

firebase.initializeApp(firebaseConfig);
// Firestore
const firestore = firebase.firestore();

// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // 1. Referencias a elementos del DOM
    const incidenciasReporteContainer = document.getElementById('incidenciasReporteContainer');
    const reporteTitulo = document.getElementById('reporteTitulo');
    const reporteFechaElement = document.getElementById('reporteFecha');
    const noIncidenciasMessage = incidenciasReporteContainer.querySelector('.no-incidencias-message');
    const downloadPdfButton = document.getElementById('downloadPdfButton');
    const downloadTxtButton = document.getElementById('downloadTxtButton');
    const exportarExcelBtn = document.getElementById('exportarExcelBtn');
    const reporteContent = document.getElementById('reporteContent');
    const filtroFechaInput = document.getElementById('filtroFecha');
    const filtroTipoIncidenciaSelect = document.getElementById('filtroTipoIncidencia');
    const aplicarFiltrosBtn = document.getElementById('aplicarFiltrosBtn');
    const resetFiltrosBtn = document.getElementById('resetFiltrosBtn');
    const eliminarReporteBtn = document.getElementById('eliminarReporteBtn');

    let allIncidencias = [];
    let currentFilteredIncidencias = [];

    // Datos auxiliares de JSON (centros, módulos, sensores, etc.)
    let appData = {
        centros: [],
        modulosEstanques: {},
        sensoresPorCentro: {},
        parametrosModulos: {}
    };

    // 2. Función para cargar datos de JSON (necesarios para nombres, no solo IDs)
    const loadAppData = async () => {
        try {
            const centrosResponse = await fetch('data/centros.json');
            appData.centros = await centrosResponse.json();
            const modulosEstanquesResponse = await fetch('data/modulos_estanques.json');
            appData.modulosEstanques = await modulosEstanquesResponse.json();
            const sensoresPorCentroResponse = await fetch('data/sensores_por_centro.json');
            appData.sensoresPorCentro = await sensoresPorCentroResponse.json();
            const parametrosModulosResponse = await fetch('data/parametros_modulos.json');
            appData.parametrosModulos = await parametrosModulosResponse.json();
            console.log("Datos auxiliares de JSON cargados:", appData);
        } catch (error) {
            console.error("Error al cargar datos auxiliares de JSON:", error);
            alert("Hubo un error al cargar datos auxiliares (centros, módulos, etc.). Algunos detalles pueden no mostrarse correctamente.");
        }
    };

    // 3. Función para obtener las incidencias de Firestore
    const fetchIncidenciasFromFirestore = async () => {
        allIncidencias = [];
        try {
            const snapshot = await firestore.collection('incidencias').get();
            snapshot.forEach(doc => {
                allIncidencias.push({ id: doc.id, ...doc.data() });
            });
            applyFiltersAndRender();
        } catch (error) {
            incidenciasReporteContainer.innerHTML = '<p style="color: red;">Error al cargar los reportes desde Firestore. Revisa tu conexión o las reglas de seguridad.</p>';
            noIncidenciasMessage.style.display = 'none';
        }
    };

    // 4. Función principal para aplicar filtros y renderizar incidencias
    const applyFiltersAndRender = () => {
        let incidenciasToRender = [...allIncidencias];
        const filtroFecha = filtroFechaInput.value;
        const filtroTipo = filtroTipoIncidenciaSelect.value;
        if (filtroFecha) {
            incidenciasToRender = incidenciasToRender.filter(inc => {
                const incDateObj = new Date(inc.fechaHora);
                const incDateString = incDateObj.toISOString().slice(0, 10);
                return incDateString === filtroFecha;
            });
        }
        if (filtroTipo) {
            incidenciasToRender = incidenciasToRender.filter(inc => inc.tipoIncidencia === filtroTipo);
        }
        incidenciasToRender.sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());
        currentFilteredIncidencias = incidenciasToRender;
        renderIncidenciasCards(currentFilteredIncidencias);
        updateReportHeader(filtroFecha, filtroTipo, currentFilteredIncidencias.length);
    };

    // 5. Función para actualizar el encabezado del reporte
    const updateReportHeader = (fechaFiltro, tipoFiltro, count) => {
        let fechaText = "Todas las fechas";
        if (fechaFiltro) {
            const dateObj = new Date(fechaFiltro + 'T00:00:00-04:00');
            fechaText = `Fecha: ${dateObj.toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Santiago' })}`;
        }
        let tipoText = "Todos los tipos";
        if (tipoFiltro === 'modulos') tipoText = "Tipo: Módulos y Estanques";
        if (tipoFiltro === 'sensores') tipoText = "Tipo: Sistemas de Sensores";
        reporteFechaElement.textContent = `${fechaText} | ${tipoText} (${count} incidencias)`;
    };

    // 6. Función para renderizar las tarjetas de incidencias
    const renderIncidenciasCards = (incidencias) => {
        incidenciasReporteContainer.innerHTML = '';
        if (incidencias.length === 0) {
            noIncidenciasMessage.style.display = 'block';
            if (!incidenciasReporteContainer.contains(noIncidenciasMessage)) {
                incidenciasReporteContainer.appendChild(noIncidenciasMessage);
            }
        } else {
            noIncidenciasMessage.style.display = 'none';
            incidencias.forEach((inc, index) => {
                const card = document.createElement('div');
                card.classList.add('incidencia-card');
                card.setAttribute('data-index', index + 1);
                const nombreCentro = appData.centros.find(c => c.id === inc.centro)?.nombre || inc.centro || 'Centro Desconocido';
                const fecha = new Date(inc.fechaHora).toLocaleString('es-CL', {
                    year: 'numeric', month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit', hour12: false,
                    timeZone: 'America/Santiago'
                });
                let detallesIncidencia = '';
                if (inc.tipoIncidencia === 'modulos') {
                    detallesIncidencia = `
                        <h3>Incidencia en Módulo/Estanque</h3>
                        <p><strong>Módulo:</strong> ${inc.modulo || 'N/A'}</p>
                        <p><strong>Estanque:</strong> ${inc.estanque || 'N/A'}</p>
                        <p><strong>Parámetros:</strong></p>
                        <ul>
                            ${inc.parametros?.oxigeno ? `<li>Oxígeno: ${inc.parametros.oxigeno} (${inc.parametros.valorOxigeno || 'N/A'})</li>` : ''}
                            ${inc.parametros?.temperatura ? `<li>Temperatura: ${inc.parametros.temperatura} (${inc.parametros.valorTemperatura || 'N/A'})</li>` : ''}
                            ${inc.parametros?.conductividad ? `<li>Conductividad: ${inc.parametros.conductividad}</li>` : ''}
                            ${inc.parametros?.turbidez ? `<li>Turbidez: ${inc.parametros.turbidez} (${inc.parametros.valorTurbidez || 'N/A'})</li>` : ''}
                            ${inc.parametros?.otros && inc.parametros.otros.length > 0 ? `<li>Otros: ${inc.parametros.otros.join(', ')}</li>` : ''}
                        </ul>
                    `;
                } else if (inc.tipoIncidencia === 'sensores') {
                    detallesIncidencia = `
                        <h3>Incidencia en Sistema de Sensores</h3>
                        <p><strong>Sistema:</strong> ${inc.sistemaSensor || 'N/A'}</p>
                        <p><strong>Sensor:</strong> ${inc.sensorDetectado || 'N/A'}</p>
                        <p><strong>Estado:</strong> ${inc.estadoSensor === 'bajo_limite' ? 'Bajo el límite' : (inc.estadoSensor === 'sobre_limite' ? 'Sobre el límite' : 'N/A')}</p>
                    `;
                }
                card.innerHTML = `
                    <h2 class="card-center-title">${nombreCentro}</h2>
                    <p><strong>Fecha/Hora:</strong> ${fecha}</p>
                    <p><strong>Turno:</strong> ${inc.turno || 'N/A'}</p>
                    <p><strong>Usuario:</strong> ${inc.nombreUsuario || 'No registrado'}</p>
                    ${detallesIncidencia}
                    <h4>Evaluación de Riesgos:</h4>
                    <p><strong>Tiempo de resolución (min):</strong> ${inc.tiempoResolucion || 'N/A'}</p>
                    <p><strong>Riesgo para peces:</strong> ${inc.riesgoPeces === 'si' ? 'Sí' : 'No'}</p>
                    <p><strong>Pérdida económica:</strong> ${inc.perdidaEconomica === 'si' ? 'Sí' : 'No'}</p>
                    <p><strong>Riesgo para personas:</strong> ${inc.riesgoPersonas === 'si' ? 'Sí' : 'No'}</p>
                    <p><strong>Observación:</strong> ${inc.observacion || 'Ninguna'}</p>
                `;
                incidenciasReporteContainer.appendChild(card);
            });
        }
    };

    // Listeners para filtros
    aplicarFiltrosBtn.addEventListener('click', applyFiltersAndRender);
    resetFiltrosBtn.addEventListener('click', () => {
        filtroFechaInput.value = '';
        filtroTipoIncidenciaSelect.value = '';
        applyFiltersAndRender();
    });

    // --- EXPORTACIÓN DE DATOS ---
    // Exportar a CSV
    exportarExcelBtn.addEventListener('click', () => {
        console.log('Botón EXPORTAR CSV presionado');
        if (!currentFilteredIncidencias.length) return alert('No hay datos para exportar.');
        const headers = Object.keys(currentFilteredIncidencias[0]);
        const csvRows = [headers.join(',')];
        currentFilteredIncidencias.forEach(obj => {
            csvRows.push(headers.map(h => '"'+(obj[h] !== undefined ? String(obj[h]).replace(/"/g, '""') : '')+'"').join(','));
        });
        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'reporte_incidencias.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // Exportar a TXT
    downloadTxtButton.addEventListener('click', () => {
        console.log('Botón DESCARGAR TXT presionado');
        if (!currentFilteredIncidencias.length) return alert('No hay datos para exportar.');
        let txt = '';
        currentFilteredIncidencias.forEach((inc, i) => {
            txt += `Incidencia #${i+1}\n`;
            Object.entries(inc).forEach(([k,v]) => {
                txt += `  ${k}: ${v}\n`;
            });
            txt += '\n';
        });
        const blob = new Blob([txt], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'reporte_incidencias.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // Exportar a PDF (usando jsPDF)
    // Función para descargar PDF visual (como en la web)
    downloadPdfButton.addEventListener('click', async () => {
        if (!currentFilteredIncidencias.length) {
            alert('No hay datos para exportar.');
            return;
        }
        downloadPdfButton.disabled = true;
        downloadPdfButton.textContent = 'Generando PDF...';
        const { jsPDF } = window.jspdf || window;
        const reporteContent = document.getElementById('reporteContent');
        const filtroFechaInput = document.getElementById('filtroFecha');
        const filtroTipoIncidenciaSelect = document.getElementById('filtroTipoIncidencia');
        try {
            const canvas = await html2canvas(reporteContent, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const pageHeight = 297;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }
            // Nombre de archivo descriptivo
            const fechaReporteNombre = filtroFechaInput.value || new Date().toLocaleDateString('es-CL', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
            const tipoReporteNombre = filtroTipoIncidenciaSelect.value || 'Todas';
            pdf.save(`Reporte_Incidencias_Cermaq_${fechaReporteNombre}_${tipoReporteNombre}.pdf`);
        } catch (error) {
            console.error('Error al generar PDF:', error);
            alert('Error al generar el PDF. Revise la consola para más detalles.');
        } finally {
            downloadPdfButton.disabled = false;
            downloadPdfButton.textContent = 'Descargar PDF';
        }
    });

    // Inicialización de la página
    const initializeReportPage = async () => {
        await loadAppData();
        fetchIncidenciasFromFirestore();
    };

    initializeReportPage();
});
