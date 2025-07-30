// script_limpio.js
// Versión limpia y funcional del JS para formulario de incidencias Cermaq
// Incluye solo una inicialización de Firebase, una declaración de cada variable y función, y lógica robusta para mostrar el perfil seleccionado

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyCpTq5L2oTJW7Mv9k3skFBPXxs9yixXsH4",
    authDomain: "monitoreo-cermaq.firebaseapp.com",
    projectId: "monitoreo-cermaq",
    storageBucket: "monitoreo-cermaq.appspot.com",
    databaseURL: "https://monitoreo-cermaq-default-rtdb.firebaseio.com",
    messagingSenderId: "25042542775",
    appId: "1:25042542775:web:0527629e71676651186d32",
    measurementId: "G-1K8E936SLQ"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const database = firebase.database();
const incidenciasRef = database.ref('incidencias');

// --- LÓGICA PRINCIPAL ---
document.addEventListener('DOMContentLoaded', function() {
    // Referencias DOM
    const nombreUsuarioInput = document.getElementById('nombreUsuario');
    const reporteDiaBtn = document.getElementById('generarReporteDia');
    const cerrarSesionBtn = document.getElementById('logoutBtn');
    const incidenciaForm = document.getElementById('incidenciaForm');
    const formMessage = document.getElementById('form-message');
    const fechaHoraInput = document.getElementById('fechaHora');
    const centroSelect = document.getElementById('centro');
    const tipoIncidenciaSection = document.getElementById('section-tipo-incidencia');
    const tipoIncidenciaRadios = document.querySelectorAll('input[name="tipoIncidencia"]');
    const modulosEstanquesSection = document.getElementById('section-modulos-estanques');
    const sistemaSensoresSection = document.getElementById('section-sistema-sensores');
    const evaluacionRiesgosSection = document.getElementById('section-evaluacion-riesgos');
    const moduloSelect = document.getElementById('modulo');
    const estanqueSelect = document.getElementById('estanque');
    const sistemaSensorSelect = document.getElementById('sistemaSensor');
    const sensorDetectadoSelect = document.getElementById('sensorDetectado');
    const oxigenoSelect = document.getElementById('oxigeno');
    const valorOxigenoInput = document.getElementById('valorOxigeno');
    const temperaturaSelect = document.getElementById('temperatura');
    const valorTemperaturaInput = document.getElementById('valorTemperatura');
    const turbidezSelect = document.getElementById('turbidez');
    const valorTurbidezInput = document.getElementById('valorTurbidez');

    // Mostrar nombre de perfil seleccionado
    const selectedProfileName = localStorage.getItem('selectedProfileName');
    if (selectedProfileName && nombreUsuarioInput) {
        nombreUsuarioInput.value = selectedProfileName;
        nombreUsuarioInput.readOnly = true;
    } else if (nombreUsuarioInput) {
        nombreUsuarioInput.value = 'Perfil no seleccionado';
    }

    // --- LÓGICA DE SESIÓN Y BOTONES ---
    if (reporteDiaBtn) {
        reporteDiaBtn.addEventListener('click', () => {
            const today = new Date().toISOString().slice(0, 10);
            localStorage.setItem('fechaReporteActual', today);
            window.location.href = 'reporte.html'; // Corregido de reporte_v3.html a reporte.html
        });
    }

    if (cerrarSesionBtn) {
        cerrarSesionBtn.addEventListener('click', async () => {
            try {
                await auth.signOut();
                localStorage.removeItem('selectedProfileName');
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Error al cerrar la sesión:', error);
                showMessage('No se pudo cerrar la sesión.', 'error');
            }
        });
    }

    // --- LÓGICA DE MENSAJES ---
    function showMessage(message, type) {
        if (formMessage) {
            formMessage.textContent = message;
            formMessage.className = `message ${type}`;
            formMessage.classList.remove('hidden');
        }
    }

    // --- LÓGICA DE FORMULARIO Y CARGA DE DATOS ---
    let appData = {
        centros: [],
        modulosEstanques: {},
        sensoresPorCentro: {},
        parametrosModulos: {}
    };
    async function loadData() {
        try {
            const [centrosRes, modulosRes, sensoresRes, paramsRes] = await Promise.all([
                fetch('data/centros.json'),
                fetch('data/modulos_estanques.json'),
                fetch('data/sensores_por_centro.json'),
                fetch('data/parametros_modulos.json')
            ]);
            appData.centros = await centrosRes.json();
            appData.modulosEstanques = await modulosRes.json();
            appData.sensoresPorCentro = await sensoresRes.json();
            appData.parametrosModulos = await paramsRes.json();
            populateSelect(centroSelect, appData.centros, 'id', 'nombre');
            console.log('Datos de JSON cargados exitosamente.');
        } catch (error) {
            console.error('Error al cargar los datos de JSON:', error);
            showMessage('Hubo un error al cargar los datos. Por favor, recargue la página.', 'error');
        }
    }
    function populateSelect(selectElement, items, valueKey, textKey) {
        if (!selectElement) return;
        selectElement.innerHTML = `<option value="">Seleccione una opción</option>`;
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item[valueKey];
            option.textContent = item[textKey];
            selectElement.appendChild(option);
        });
    }
    function showSection(sectionElement) {
        if(sectionElement) sectionElement.classList.remove('hidden');
    }
    function hideSection(sectionElement) {
        if(sectionElement) sectionElement.classList.add('hidden');
    }
    function setLocalDateTime() {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        const localDateTime = new Date(now.getTime() - offset).toISOString().slice(0, 16);
        if (fechaHoraInput) fechaHoraInput.value = localDateTime;
    }
    
    // Inicialización
    setLocalDateTime();
    loadData();

    // Listener para el cambio de centro
    if (centroSelect) {
        centroSelect.addEventListener('change', function() {
            if (!centroSelect.value) {
                // Si se deselecciona el centro, ocultar y resetear todo lo dependiente
                hideSection(tipoIncidenciaSection);
                hideSection(modulosEstanquesSection);
                hideSection(sistemaSensoresSection);
                hideSection(evaluacionRiesgosSection);

                // Opcional: resetear selects y radios dependientes
                document.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
                document.querySelectorAll('select').forEach(s => {
                    if (s !== centroSelect) s.selectedIndex = 0;
                });
            } else {
                // Si hay centro seleccionado, mostrar la siguiente sección
                showSection(tipoIncidenciaSection);
            }
        });
    }
    if(valorOxigenoInput) valorOxigenoInput.style.display = 'none';
    if(valorTemperaturaInput) valorTemperaturaInput.style.display = 'none';
    if(valorTurbidezInput) valorTurbidezInput.style.display = 'none';

    // Listeners para tipo de incidencia
    if (tipoIncidenciaRadios) {
        tipoIncidenciaRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                const selectedCentroId = centroSelect.value;
                if (this.value === 'parametros') {
                    showSection(modulosEstanquesSection);
                    hideSection(sistemaSensoresSection);
                    if (selectedCentroId && appData.modulosEstanques[selectedCentroId]) {
                        const modulosData = appData.modulosEstanques[selectedCentroId];
                        const modulosArray = Object.keys(modulosData).map(nombre => ({ id: nombre, nombre: nombre }));
                        populateSelect(moduloSelect, modulosArray, 'id', 'nombre');
                    } else {
                        moduloSelect.innerHTML = '<option value="">Seleccione un módulo</option>';
                    }
                    estanqueSelect.innerHTML = '<option value="">Seleccione un estanque</option>';
                } else if (this.value === 'sensores') {
                    hideSection(modulosEstanquesSection);
                    showSection(sistemaSensoresSection);
                    if (selectedCentroId && appData.sensoresPorCentro[selectedCentroId]) {
                        populateSelect(sistemaSensorSelect, appData.sensoresPorCentro[selectedCentroId], 'id', 'nombre');
                    } else {
                        sistemaSensorSelect.innerHTML = '<option value="">Seleccione un sistema</option>';
                    }
                }
            });
        });
    }

    // Listener para el cambio de módulo
    if (moduloSelect) {
        moduloSelect.addEventListener('change', function() {
            const selectedCentroId = centroSelect.value;
            const selectedModuloId = this.value;
            if (selectedCentroId && selectedModuloId && appData.modulosEstanques[selectedCentroId]) {
                const estanquesData = appData.modulosEstanques[selectedCentroId][selectedModuloId];
                if (estanquesData) {
                    const estanquesArray = estanquesData.map(id => ({ id: id, nombre: id }));
                    populateSelect(estanqueSelect, estanquesArray, 'id', 'nombre');
                }
            }
        });
    }

    // Listener para el cambio de estanque
    if (estanqueSelect) {
        estanqueSelect.addEventListener('change', function() {
            if (this.value) {
                showSection(evaluacionRiesgosSection);
            } else {
                hideSection(evaluacionRiesgosSection);
            }
        });
    }

    // Función para manejar la visibilidad de los inputs de parámetros
    function handleParameterChange(selectElement, inputElement) {
        if (!selectElement || !inputElement) return;
        selectElement.addEventListener('change', function() {
            if (this.value === 'alta' || this.value === 'baja') {
                inputElement.style.display = 'block';
            } else {
                inputElement.style.display = 'none';
            }
        });
    }

    // Listeners para los parámetros
    handleParameterChange(oxigenoSelect, valorOxigenoInput);
    handleParameterChange(temperaturaSelect, valorTemperaturaInput);
    handleParameterChange(turbidezSelect, valorTurbidezInput);

    // Listener para el envío del formulario
    if (incidenciaForm) {
        incidenciaForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            try {
                const incidenciaData = {
                    usuario: nombreUsuarioInput.value,
                    fechaHora: fechaHoraInput.value,
                    turno: document.getElementById('turno').value,
                    centro: centroSelect.options[centroSelect.selectedIndex].text,
                    tipoIncidencia: document.querySelector('input[name="tipoIncidencia"]:checked').value,
                    creadoEn: new Date()
                };

                if (incidenciaData.tipoIncidencia === 'parametros') {
                    incidenciaData.modulo = moduloSelect.value;
                    incidenciaData.estanque = estanqueSelect.value;

                    // Guardar parámetros solo si tienen un estado seleccionado
                    if (oxigenoSelect.value) {
                        incidenciaData.oxigeno = {
                            estado: oxigenoSelect.value,
                            valor: valorOxigenoInput.value
                        };
                    }
                    if (temperaturaSelect.value) {
                        incidenciaData.temperatura = {
                            estado: temperaturaSelect.value,
                            valor: valorTemperaturaInput.value
                        };
                    }
                    if (turbidezSelect.value) {
                        incidenciaData.turbidez = {
                            estado: turbidezSelect.value,
                            valor: valorTurbidezInput.value
                        };
                    }
                } else if (incidenciaData.tipoIncidencia === 'sensores') {
                    incidenciaData.sistemaSensor = sistemaSensorSelect.options[sistemaSensorSelect.selectedIndex].text;
                    incidenciaData.sensorDetectado = sensorDetectadoSelect.options[sensorDetectadoSelect.selectedIndex].text;
                    incidenciaData.estadoSensor = document.getElementById('estadoSensor').value;
                }

                // Datos de evaluación de riesgos
                incidenciaData.tiempoResolucion = document.getElementById('tiempoResolucion').value;
                incidenciaData.riesgoPeces = document.querySelector('input[name="riesgoPeces"]:checked').value;
                incidenciaData.perdidaEconomica = document.querySelector('input[name="perdidaEconomica"]:checked').value;
                incidenciaData.riesgoPersonas = document.querySelector('input[name="riesgoPersonas"]:checked').value;

                // Manejar campo de observación
                const observacionValue = document.getElementById('observacion').value.trim();
                incidenciaData.observacion = observacionValue ? observacionValue : 'sin observaciones';

                // Guardar en Firestore
                await db.collection('incidencias').add(incidenciaData);

                showMessage('Incidencia registrada con éxito.', 'success');
                incidenciaForm.reset();
                // Ocultar secciones después de enviar
                hideSection(tipoIncidenciaSection);
                hideSection(modulosEstanquesSection);
                hideSection(sistemaSensoresSection);
                hideSection(evaluacionRiesgosSection);

            } catch (error) {
                console.error('Error al registrar la incidencia:', error);
                showMessage('Error al registrar la incidencia. Por favor, revisa todos los campos.', 'error');
            }
        });
    }

});
