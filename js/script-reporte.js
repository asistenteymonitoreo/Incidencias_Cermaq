// script-reporte.js (La versión "Dios" para reportes y exportación)

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
const database = firebase.database();
const incidenciasRef = database.ref('incidencias'); // Mismo nodo que usas para guardar
// ----------------------------------------------------


document.addEventListener('DOMContentLoaded', () => {
    // 1. Referencias a elementos del DOM
    const incidenciasReporteContainer = document.getElementById('incidenciasReporteContainer');
    const reporteTitulo = document.getElementById('reporteTitulo'); // Ya existe
    const reporteFechaElement = document.getElementById('reporteFecha'); // Ya existe
    const noIncidenciasMessage = incidenciasReporteContainer.querySelector('.no-incidencias-message');
    const downloadPdfButton = document.getElementById('downloadPdfButton');
    const downloadTxtButton = document.getElementById('downloadTxtButton');
    const exportarExcelBtn = document.getElementById('exportarExcelBtn'); // Nuevo botón para Excel
    const reporteContent = document.getElementById('reporteContent'); // El div que html2canvas capturará

    // Elementos de filtro
    const filtroFechaInput = document.getElementById('filtroFecha');
    const filtroTipoIncidenciaSelect = document.getElementById('filtroTipoIncidencia');
    const aplicarFiltrosBtn = document.getElementById('aplicarFiltrosBtn');
    const resetFiltrosBtn = document.getElementById('resetFiltrosBtn');
    const eliminarReporteBtn = document.getElementById('eliminarReporteBtn'); // Botón para eliminar

    let allIncidencias = []; // Almacenará TODAS las incidencias cargadas desde Firebase
    let currentFilteredIncidencias = []; // Almacenará las incidencias actualmente filtradas y renderizadas

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

            // Puedes rellenar 'centrosData' aquí si lo prefieres, o seguir usándolo directamente
            // centrosData = appData.centros.reduce((acc, centro) => { acc[centro.id] = centro.nombre; return acc; }, {});

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

    // 3. Función para obtener las incidencias de Firebase
    const fetchIncidenciasFromFirebase = () => {
        incidenciasRef.on('value', (snapshot) => {
            allIncidencias = []; // Limpiar para recargar
            const incidenciasRaw = snapshot.val();

            if (incidenciasRaw) {
                for (let key in incidenciasRaw) {
                    allIncidencias.push({ id: key, ...incidenciasRaw[key] });
                }
            }
            console.log("Incidencias cargadas de Firebase:", allIncidencias);
            applyFiltersAndRender(); // Re-renderizar después de cargar/actualizar los datos
        }, (error) => {
            console.error("Error al leer incidencias de Firebase:", error);
            incidenciasReporteContainer.innerHTML = '<p style="color: red;">Error al cargar los reportes desde Firebase. Revisa tu conexión o las reglas de seguridad.</p>';
            noIncidenciasMessage.style.display = 'none'; // Asegurar que no se muestre el mensaje de no incidencias
        });
    };

    // 4. Función principal para aplicar filtros y renderizar incidencias
    const applyFiltersAndRender = () => {
        let incidenciasToRender = [...allIncidencias]; // Empezar con todas las incidencias

        const filtroFecha = filtroFechaInput.value; // Formato YYYY-MM-DD
        const filtroTipo = filtroTipoIncidenciaSelect.value;

        // 1. Filtrar por fecha si se seleccionó una
        if (filtroFecha) {
            incidenciasToRender = incidenciasToRender.filter(inc => {
                const incDateObj = new Date(inc.fechaHora);
                const incDateString = incDateObj.toISOString().slice(0, 10); // YYYY-MM-DD
                return incDateString === filtroFecha;
            });
        }

        // 2. Filtrar por tipo de incidencia si se seleccionó uno
        if (filtroTipo) {
            incidenciasToRender = incidenciasToRender.filter(inc => inc.tipoIncidencia === filtroTipo);
        }

        // Ordenar las incidencias filtradas por fecha y hora (más antiguas primero)
        incidenciasToRender.sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());

        currentFilteredIncidencias = incidenciasToRender; // Actualizar la lista de incidencias actualmente visibles
        renderIncidenciasCards(currentFilteredIncidencias); // Renderizar las tarjetas
        updateReportHeader(filtroFecha, filtroTipo, currentFilteredIncidencias.length); // Actualizar el encabezado
    };

    // 5. Función para actualizar el encabezado del reporte
    const updateReportHeader = (fechaFiltro, tipoFiltro, count) => {
        let fechaText = "Todas las fechas";
        if (fechaFiltro) {
            // Usa una función de formato más robusta para la fecha
            const dateObj = new Date(fechaFiltro + 'T00:00:00-04:00'); // Asume hora local de Chile
            fechaText = `Fecha: ${dateObj.toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Santiago' })}`;
        }

        let tipoText = "Todos los tipos";
        if (tipoFiltro === 'modulos') tipoText = "Tipo: Módulos y Estanques";
        if (tipoFiltro === 'sensores') tipoText = "Tipo: Sistemas de Sensores";

        reporteFechaElement.textContent = `${fechaText} | ${tipoText} (${count} incidencias)`;
    };


    // 6. Función para renderizar las tarjetas de incidencias
    const renderIncidenciasCards = (incidencias) => {
        incidenciasReporteContainer.innerHTML = ''; // Limpiar el contenedor

        if (incidencias.length === 0) {
            noIncidenciasMessage.style.display = 'block';
            // Vuelve a añadir el mensaje si se eliminó al limpiar innerHTML
            if (!incidenciasReporteContainer.contains(noIncidenciasMessage)) {
                incidenciasReporteContainer.appendChild(noIncidenciasMessage);
            }
        } else {
            noIncidenciasMessage.style.display = 'none';
            incidencias.forEach((inc, index) => {
                const card = document.createElement('div');
                card.classList.add('incidencia-card');
                card.setAttribute('data-index', index + 1);

                // Obtener el nombre del centro usando el ID de appData.centros
                const nombreCentro = appData.centros.find(c => c.id === inc.centro)?.nombre || inc.centro || 'Centro Desconocido';

                // Asegura que la fecha/hora se muestre en la zona horaria local de Chile
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


    // ----------------------------------------------------
    // -- Funciones de Exportación --
    // ----------------------------------------------------

    // Función para escapar comas y comillas dobles en un valor para CSV
    const escapeCsvValue = (value) => {
        if (value === null || value === undefined) return '';
        value = String(value);
        if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes(';')) { // Añadido ;
            return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
    };

    // Exportar a Excel (CSV)
    exportarExcelBtn.addEventListener('click', () => {
        if (currentFilteredIncidencias.length === 0) {
            alert('No hay incidencias para exportar a Excel con los filtros actuales.');
            return;
        }

        // Encabezados del CSV - ¡Deben ser lo más completos posible!
        const headers = [
            'ID Incidencia', 'Fecha y Hora', 'Turno', 'Centro', 'Tipo de Incidencia',
            'Modulo', 'Estanque', 'Oxigeno Tipo', 'Valor Oxigeno', 'Temperatura Tipo', 'Valor Temperatura',
            'Conductividad', 'Turbidez Tipo', 'Valor Turbidez', 'Otros Parametros',
            'Sistema Sensor', 'Sensor Detectado', 'Estado Sensor',
            'Tiempo Resolucion (min)', 'Riesgo Peces', 'Perdida Economica', 'Riesgo Personas', 'Observacion'
        ];

        let csvContent = headers.map(escapeCsvValue).join(',') + '\n';

        currentFilteredIncidencias.forEach(incidencia => {
            const row = [];

            row.push(incidencia.id || '');
            row.push(new Date(incidencia.fechaHora).toLocaleString('es-CL', { timeZone: 'America/Santiago' }) || '');
            row.push(incidencia.turno || '');
            row.push(appData.centros.find(c => c.id === incidencia.centro)?.nombre || incidencia.centro || '');
            row.push(incidencia.tipoIncidencia === 'modulos' ? 'Módulos y Estanques' : (incidencia.tipoIncidencia === 'sensores' ? 'Sistema de Sensores' : incidencia.tipoIncidencia || ''));

            // Campos de Módulos y Estanques (o vacíos si no aplican)
            row.push(incidencia.modulo || '');
            row.push(incidencia.estanque || '');
            row.push(incidencia.parametros?.oxigeno || '');
            row.push(incidencia.parametros?.valorOxigeno || '');
            row.push(incidencia.parametros?.temperatura || '');
            row.push(incidencia.parametros?.valorTemperatura || '');
            row.push(incidencia.parametros?.conductividad || '');
            row.push(incidencia.parametros?.turbidez || '');
            row.push(incidencia.parametros?.valorTurbidez || '');
            row.push(incidencia.parametros?.otros?.join('; ') || ''); // Si hay múltiples, separarlos con ;

            // Campos de Sensores (o vacíos si no aplican)
            row.push(incidencia.sistemaSensor || '');
            row.push(incidencia.sensorDetectado || '');
            row.push(incidencia.estadoSensor === 'bajo_limite' ? 'Bajo el límite' : (incidencia.estadoSensor === 'sobre_limite' ? 'Sobre el límite' : (incidencia.estadoSensor || '')));

            // Campos de Evaluación de Riesgos
            row.push(incidencia.evaluacionRiesgos?.tiempoResolucion || '');
            row.push(incidencia.evaluacionRiesgos?.riesgoPeces === 'si' ? 'Sí' : 'No' || '');
            row.push(incidencia.evaluacionRiesgos?.perdidaEconomica === 'si' ? 'Sí' : 'No' || '');
            row.push(incidencia.evaluacionRiesgos?.riesgoPersonas === 'si' ? 'Sí' : 'No' || '');
            row.push(escapeCsvValue(incidencia.evaluacionRiesgos?.observacion || '')); // Asegurar que la observación se escape correctamente

            csvContent += row.map(escapeCsvValue).join(',') + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        const dateSuffix = filtroFechaInput.value || new Date().toISOString().slice(0, 10);
        const typeSuffix = filtroTipoIncidenciaSelect.value || 'Todas';
        link.setAttribute('download', `Reporte_Incidencias_Cermaq_${dateSuffix}_${typeSuffix}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    });

    // Función para descargar PDF (Usa currentFilteredIncidencias)
    downloadPdfButton.addEventListener('click', async () => {
        if (currentFilteredIncidencias.length === 0) {
            alert('No hay incidencias para generar el PDF con los filtros actuales.');
            return;
        }

        downloadPdfButton.disabled = true;
        downloadPdfButton.textContent = 'Generando PDF...';

        const { jsPDF } = window.jspdf;

        // Captura el contenido del reporte completo
        html2canvas(reporteContent, {
            scale: 2, // Mayor escala para mejor calidad de imagen
            useCORS: true, // Importante si tienes imágenes de diferentes orígenes
            logging: true, // Para depuración
            allowTaint: true // Permite capturar elementos que podrían "ensuciar" el canvas (ej. imágenes externas)
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4'); // 'p' para retrato, 'mm' para unidades, 'a4' para tamaño

            const imgWidth = 210; // Ancho A4 en mm
            const pageHeight = 297; // Alto A4 en mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width; // Altura de la imagen proporcional al ancho del PDF
            let heightLeft = imgHeight; // Altura restante de la imagen por renderizar

            let position = 0; // Posición Y en el PDF

            // Añadir la primera página
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            // Añadir páginas adicionales si la imagen es más larga que una página
            while (heightLeft >= -10) { // Un pequeño margen para evitar cortes extraños
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            const fechaReporteNombre = filtroFechaInput.value || new Date().toLocaleDateString('es-CL');
            const tipoReporteNombre = filtroTipoIncidenciaSelect.value || 'Todas';
            pdf.save(`Reporte_Incidencias_Cermaq_${fechaReporteNombre}_${tipoReporteNombre}.pdf`);

            downloadPdfButton.disabled = false;
            downloadPdfButton.textContent = 'Descargar PDF';
        }).catch(error => {
            console.error('Error al generar PDF:', error);
            alert('Error al generar el PDF. Revise la consola para más detalles.');
            downloadPdfButton.disabled = false;
            downloadPdfButton.textContent = 'Descargar PDF';
        });
    });

    // Función para descargar TXT (Usa currentFilteredIncidencias)
    downloadTxtButton.addEventListener('click', () => {
        if (currentFilteredIncidencias.length === 0) {
            alert('No hay incidencias para generar el archivo TXT con los filtros actuales.');
            return;
        }

        let txtContent = `REPORTE DE INCIDENCIAS CERMAQ CHILE\n`;
        const fechaReporteTxt = filtroFechaInput.value || "Todas las fechas";
        const tipoReporteTxt = filtroTipoIncidenciaSelect.value ?
            (filtroTipoIncidenciaSelect.value === 'modulos' ? 'Módulos y Estanques' : 'Sistemas de Sensores') :
            'Todos los tipos';
        txtContent += `Filtros: Fecha: ${fechaReporteTxt} | Tipo: ${tipoReporteTxt}\n\n`;

        currentFilteredIncidencias.forEach((inc, index) => {
            const nombreCentro = appData.centros.find(c => c.id === inc.centro)?.nombre || inc.centro || 'Centro Desconocido';
            const formattedDate = new Date(inc.fechaHora).toLocaleString('es-CL', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', hour12: false,
                timeZone: 'America/Santiago'
            });

            txtContent += `--- INCIDENCIA #${index + 1} ---\n`;
            txtContent += `Centro: ${nombreCentro}\n`;
            txtContent += `Fecha/Hora: ${formattedDate}\n`;
            txtContent += `Turno: ${inc.turno || 'N/A'}\n`;

            if (inc.tipoIncidencia === 'modulos') {
                txtContent += `Tipo: Módulos y Estanques\n`;
                txtContent += `Módulo: ${inc.modulo || 'N/A'}\n`;
                txtContent += `Estanque: ${inc.estanque || 'N/A'}\n`;
                txtContent += `Parámetros:\n`;
                if (inc.parametros?.oxigeno) txtContent += `  - Oxígeno: ${inc.parametros.oxigeno} (${inc.parametros.valorOxigeno || 'N/A'})\n`;
                if (inc.parametros?.temperatura) txtContent += `  - Temperatura: ${inc.parametros.temperatura} (${inc.parametros.valorTemperatura || 'N/A'})\n`;
                if (inc.parametros?.conductividad) txtContent += `  - Conductividad: ${inc.parametros.conductividad || 'N/A'}\n`;
                if (inc.parametros?.turbidez) txtContent += `  - Turbidez: ${inc.parametros.turbidez} (${inc.parametros.valorTurbidez || 'N/A'})\n`;
                if (inc.parametros?.otros && inc.parametros.otros.length > 0) txtContent += `  - Otros: ${inc.parametros.otros.join(', ')}\n`;
            } else if (inc.tipoIncidencia === 'sensores') {
                txtContent += `Tipo: Sistema de Sensores\n`;
                txtContent += `Sistema: ${inc.sistemaSensor || 'N/A'}\n`;
                txtContent += `Sensor Detectado: ${inc.sensorDetectado || 'N/A'}\n`;
                txtContent += `Estado Sensor: ${inc.estadoSensor === 'bajo_limite' ? 'Bajo el límite' : (inc.estadoSensor === 'sobre_limite' ? 'Sobre el límite' : 'N/A')}\n`;
            }

            txtContent += `Tiempo de resolución (min): ${inc.evaluacionRiesgos?.tiempoResolucion || 'N/A'}\n`;
            txtContent += `Riesgo para peces: ${inc.evaluacionRiesgos?.riesgoPeces === 'si' ? 'Sí' : 'No'}\n`;
            txtContent += `Pérdida económica: ${inc.evaluacionRiesgos?.perdidaEconomica === 'si' ? 'Sí' : 'No'}\n`;
            txtContent += `Riesgo para personas: ${inc.evaluacionRiesgos?.riesgoPersonas === 'si' ? 'Sí' : 'No'}\n`;
            txtContent += `Observación: ${inc.evaluacionRiesgos?.observacion || 'Ninguna'}\n\n`;
        });

        const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const filename = `Reporte_Incidencias_Cermaq_${fechaReporteTxt.replace(/\//g, '-')}_${tipoReporteTxt.replace(/\s/g, '_')}.txt`;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // ----------------------------------------------------
    // -- Event Listeners para Filtros y Reseteo --
    // ----------------------------------------------------
    aplicarFiltrosBtn.addEventListener('click', applyFiltersAndRender);
    resetFiltrosBtn.addEventListener('click', () => {
        filtroFechaInput.value = '';
        filtroTipoIncidenciaSelect.value = '';
        applyFiltersAndRender();
    });

    // ----------------------------------------------------
    // -- Inicialización de la Página de Reportes --
    // ----------------------------------------------------
    const initializeReportPage = async () => {
        await loadAppData(); // Cargar los datos de JSON (centros, etc.) primero

        // Intenta pre-seleccionar la fecha del reporte si se viene desde index.html
        const fechaInicialReporteRaw = localStorage.getItem('fechaReporteActual');
        if (fechaInicialReporteRaw) {
            const initialDate = new Date(fechaInicialReporteRaw);
            const year = initialDate.getFullYear();
            const month = String(initialDate.getMonth() + 1).padStart(2, '0');
            const day = String(initialDate.getDate()).padStart(2, '0');
            filtroFechaInput.value = `${year}-${month}-${day}`;
            localStorage.removeItem('fechaReporteActual'); // Limpiar para que no afecte futuras visitas
        }
        
        fetchIncidenciasFromFirebase(); // Iniciar la escucha y carga de Firebase
    };

    // ----------------------------------------------------
    // -- Funcionalidad para Eliminar Incidencias por Fecha --
    // ----------------------------------------------------
    const handleDeleteByDate = () => {
        const fechaParaEliminar = filtroFechaInput.value;

        if (!fechaParaEliminar) {
            alert('Por favor, selecciona una fecha en el filtro para poder eliminar las incidencias correspondientes.');
            return;
        }

        const confirmacion = confirm(`¿Estás seguro de que quieres eliminar TODAS las incidencias del día ${fechaParaEliminar}? Esta acción no se puede deshacer.`);

        if (!confirmacion) {
            console.log('Eliminación cancelada por el usuario.');
            return;
        }

        // Encontrar todas las incidencias que coinciden con la fecha seleccionada
        const idsParaEliminar = allIncidencias
            .filter(inc => {
                const incDateString = new Date(inc.fechaHora).toISOString().slice(0, 10);
                return incDateString === fechaParaEliminar;
            })
            .map(inc => inc.id);

        if (idsParaEliminar.length === 0) {
            alert(`No se encontraron incidencias para la fecha ${fechaParaEliminar}.`);
            return;
        }

        console.log(`Se eliminarán ${idsParaEliminar.length} incidencias con fecha ${fechaParaEliminar}.`);

        // Crear un objeto para una actualización multi-ruta (elimina todo de una vez)
        const updates = {};
        idsParaEliminar.forEach(id => {
            updates[id] = null; // Poner a null un nodo en Firebase lo elimina
        });

        // Ejecutar la eliminación
        incidenciasRef.update(updates)
            .then(() => {
                alert(`Se han eliminado correctamente ${idsParaEliminar.length} incidencias del día ${fechaParaEliminar}.`);
                // La vista se actualizará automáticamente gracias al listener 'on value'
            })
            .catch(error => {
                console.error('Error al eliminar las incidencias:', error);
                alert('Hubo un error al intentar eliminar las incidencias. Por favor, revisa la consola para más detalles.');
            });
    };

    eliminarReporteBtn.addEventListener('click', handleDeleteByDate);


    initializeReportPage(); // Llama a la función de inicialización
});