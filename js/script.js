// script.js (para la página del formulario principal)

// ----------------------------------------------------
// -- CONFIGURACIÓN DE FIREBASE --
// ----------------------------------------------------
const firebaseConfig = {
    apiKey: "AIzaSyCpTq5L2oTJW7Mv9k3skFBPXxs9yixXsH4",
    authDomain: "monitoreo-cermaq.firebaseapp.com",
    projectId: "monitoreo-cermaq",
    databaseURL: "https://monitoreo-cermaq-default-rtdb.firebaseio.com", 
    messagingSenderId: "25042542775",
    appId: "1:25042542775:web:0527629e71676651186d32",
    measurementId: "G-1K8E936SLQ"
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const incidenciasRef = database.ref('incidencias'); // Nodo principal para guardar las incidencias
const auth = firebase.auth(); // Obtener la instancia de Auth
// ----------------------------------------------------


document.addEventListener('DOMContentLoaded', () => {
    // Usar setTimeout para asegurar que el DOM esté completamente listo
    setTimeout(() => {
        const nombreUsuarioInput = document.getElementById('nombreUsuario');
        const selectedProfileName = localStorage.getItem('selectedProfileName');

        if (selectedProfileName && nombreUsuarioInput) {
            nombreUsuarioInput.value = selectedProfileName;
        } else if (nombreUsuarioInput) {
            nombreUsuarioInput.value = 'Perfil no seleccionado';
        }
    }, 100);

    // 1. Obtener referencias a los elementos del DOM
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
    const submitButton = document.getElementById('submitForm');
    const oxigenoSelect = document.getElementById('oxigeno');
    const valorOxigenoInput = document.getElementById('valorOxigeno');
    const temperaturaSelect = document.getElementById('temperatura');
    const valorTemperaturaInput = document.getElementById('valorTemperatura');
    const turbidezSelect = document.getElementById('turbidez');
    const valorTurbidezInput = document.getElementById('valorTurbidez');
    const generarReporteDiaBtn = document.getElementById('generarReporteDia');
    const logoutBtn = document.getElementById('logoutBtn');
    const formMessage = document.getElementById('form-message'); // Contenedor para mensajes

    // Almacenará los datos cargados desde los JSON (para poblar selects)
    let appData = { // Renombrado a appData para evitar conflicto con 'data' global de Firebase si se usara
        centros: [],
        modulosEstanques: {},
        sensoresPorCentro: {},
        parametrosModulos: {}
    };

    // 2. Función para cargar datos desde JSON
    const loadData = async () => {
        try {
            const centrosResponse = await fetch('data/centros.json');
            appData.centros = await centrosResponse.json();
            populateSelect(centroSelect, appData.centros, 'id', 'nombre');

            const modulosEstanquesResponse = await fetch('data/modulos_estanques.json');
            appData.modulosEstanques = await modulosEstanquesResponse.json();

            const sensoresPorCentroResponse = await fetch('data/sensores_por_centro.json');
            appData.sensoresPorCentro = await sensoresPorCentroResponse.json();

            const parametrosModulosResponse = await fetch('data/parametros_modulos.json');
            appData.parametrosModulos = await parametrosModulosResponse.json();

            console.log('Datos de JSON cargados exitosamente:', appData);

        } catch (error) {
            console.error('Error al cargar los datos de JSON:', error);
            showMessage('Hubo un error al cargar los datos del formulario. Por favor, recargue la página.', 'error');
        }
    };

    // 3. Función auxiliar para poblar un <select>
    const populateSelect = (selectElement, items, valueKey, textKey) => {
        selectElement.innerHTML = '<option value="">Seleccione una opción</option>';
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item[valueKey];
            option.textContent = item[textKey];
            selectElement.appendChild(option);
        });
    };

    // 4. Funciones para manejar la visibilidad de las secciones
    const showSection = (sectionElement) => {
        sectionElement.classList.remove('hidden');
    };

    const hideSection = (sectionElement) => {
        sectionElement.classList.add('hidden');
    };

    // 5. Manejadores de eventos (existentes, con mejoras y unificación)

    // Autocompletar fecha y hora actual
    const setLocalDateTime = () => {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000; // Offset en milisegundos
        const localDateTime = new Date(now.getTime() - offset).toISOString().slice(0, 16);
        fechaHoraInput.value = localDateTime;
    };
    setLocalDateTime(); // Ejecutar al cargar la página

    // Evento al cambiar el centro
    centroSelect.addEventListener('change', () => {
        if (centroSelect.value) {
            showSection(tipoIncidenciaSection);
            // Reiniciar radios de tipo de incidencia y ocultar secciones dependientes
            tipoIncidenciaRadios.forEach(radio => radio.checked = false);
            hideSection(modulosEstanquesSection);
            hideSection(sistemaSensoresSection);
            hideSection(evaluacionRiesgosSection);
            // Limpiar selectores de modulo/estanque/sistema/sensor
            moduloSelect.innerHTML = '<option value="">Seleccione un módulo</option>';
            estanqueSelect.innerHTML = '<option value="">Seleccione un estanque</option>';
            sistemaSensorSelect.innerHTML = '<option value="">Seleccione un sistema</option>';
            sensorDetectadoSelect.innerHTML = '<option value="">Seleccione un sensor</option>';
            // Ocultar inputs numéricos de parámetros
            valorOxigenoInput.style.display = 'none';
            valorTemperaturaInput.style.display = 'none';
            valorTurbidezInput.style.display = 'none';
        } else {
            hideSection(tipoIncidenciaSection);
            hideSection(modulosEstanquesSection);
            hideSection(sistemaSensoresSection);
            hideSection(evaluacionRiesgosSection);
        }
    });

    // Evento al cambiar el tipo de incidencia (radio buttons)
    tipoIncidenciaRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            const selectedTipo = radio.value;
            hideSection(modulosEstanquesSection);
            hideSection(sistemaSensoresSection);
            hideSection(evaluacionRiesgosSection); // Ocultar siempre al cambiar tipo

            if (selectedTipo === 'modulos') {
                showSection(modulosEstanquesSection);
                const centroSeleccionadoId = centroSelect.value;
                const modulosDelCentro = appData.modulosEstanques[centroSeleccionadoId] || {};
                const modulosArray = Object.keys(modulosDelCentro).map(key => ({ id: key, nombre: key }));
                populateSelect(moduloSelect, modulosArray, 'id', 'nombre');
                estanqueSelect.innerHTML = '<option value="">Seleccione un estanque</option>';
                valorOxigenoInput.style.display = 'none';
                valorTemperaturaInput.style.display = 'none';
                valorTurbidezInput.style.display = 'none';
            } else if (selectedTipo === 'sensores') {
                showSection(sistemaSensoresSection);
                const centroSeleccionadoId = centroSelect.value;
                const sistemasDelCentro = appData.sensoresPorCentro[centroSeleccionadoId] || {};
                const sistemasArray = Object.keys(sistemasDelCentro).map(key => ({ id: key, nombre: key }));
                populateSelect(sistemaSensorSelect, sistemasArray, 'id', 'nombre');
                sensorDetectadoSelect.innerHTML = '<option value="">Seleccione un sensor</option>';
            }
            showSection(evaluacionRiesgosSection);
        });
    });

    // Evento al cambiar el módulo (solo para tipo "Módulos y Estanques")
    moduloSelect.addEventListener('change', () => {
        const centroSeleccionadoId = centroSelect.value;
        const moduloSeleccionadoId = moduloSelect.value;
        estanqueSelect.innerHTML = '<option value="">Seleccione un estanque</option>';

        if (moduloSeleccionadoId && appData.modulosEstanques[centroSeleccionadoId]) {
            const estanquesDelModulo = appData.modulosEstanques[centroSeleccionadoId][moduloSeleccionadoId] || [];
            estanquesDelModulo.forEach(estanque => {
                const option = document.createElement('option');
                option.value = estanque;
                option.textContent = estanque;
                estanqueSelect.appendChild(option);
            });
        }
    });

    // Evento al cambiar el sistema de sensor (solo para tipo "Sistema de Sensores")
    sistemaSensorSelect.addEventListener('change', () => {
        const centroSeleccionadoId = centroSelect.value;
        const sistemaSeleccionadoId = sistemaSensorSelect.value;
        sensorDetectadoSelect.innerHTML = '<option value="">Seleccione un sensor</option>';

        if (sistemaSeleccionadoId && appData.sensoresPorCentro[centroSeleccionadoId]) {
            const sensoresDelSistema = appData.sensoresPorCentro[centroSeleccionadoId][sistemaSeleccionadoId] || [];
            sensoresDelSistema.forEach(sensor => {
                const option = document.createElement('option');
                option.value = sensor;
                option.textContent = sensor;
                sensorDetectadoSelect.appendChild(option);
            });
        }
    });

    // Eventos para poblar los valores numéricos de parámetros (Oxígeno, Temperatura, Turbidez)
    const handleParametroChange = (selectElement, valueInputElement, paramName) => {
        const tipo = selectElement.value;
        valueInputElement.value = '';
        if (tipo && appData.parametrosModulos[paramName] && appData.parametrosModulos[paramName][tipo]) {
            const range = appData.parametrosModulos[paramName][tipo];
            if (range.length > 0) {
                 valueInputElement.placeholder = `Rango: ${range[0]} - ${range[range.length - 1]}`;
            } else {
                valueInputElement.placeholder = 'Ingrese valor';
            }
            valueInputElement.style.display = 'block';
        } else {
            valueInputElement.style.display = 'none';
        }
    };

    oxigenoSelect.addEventListener('change', () => handleParametroChange(oxigenoSelect, valorOxigenoInput, 'Oxígeno'));
    temperaturaSelect.addEventListener('change', () => handleParametroChange(temperaturaSelect, valorTemperaturaInput, 'Temperatura'));
    turbidezSelect.addEventListener('change', () => handleParametroChange(turbidezSelect, valorTurbidezInput, 'Turbidez'));

    // Inicialmente ocultar los inputs numéricos de parámetros
    valorOxigenoInput.style.display = 'none';
    valorTemperaturaInput.style.display = 'none';
    valorTurbidezInput.style.display = 'none';


    // ----------------------------------------------------
    // -- Lógica de Envío del Formulario a Firebase --
    // ----------------------------------------------------
    // ----------------------------------------------------
    // -- Lógica de Cierre de Sesión --
    // ----------------------------------------------------
    logoutBtn.addEventListener('click', async () => {
        try {
            await auth.signOut();
            console.log('Sesión cerrada exitosamente.');
            window.location.href = 'index.html'; // Redirigir al login al cerrar sesión
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    });

    // ----------------------------------------------------
    // -- Lógica de Envío del Formulario a Firebase --
    // ----------------------------------------------------
    submitButton.addEventListener('click', async () => {
        // Validar que el usuario esté logueado antes de intentar registrar
        if (!auth.currentUser) {
            showMessage('Debe iniciar sesión para registrar una incidencia.', 'error');
            return;
        }

        const formData = {
            nombreUsuario: document.getElementById('nombreUsuario').value, // <-- DATO AÑADIDO
            fechaHora: fechaHoraInput.value,
            turno: document.getElementById('turno').value,
            centro: centroSelect.value,
            tipoIncidencia: document.querySelector('input[name="tipoIncidencia"]:checked')?.value,
            timestamp: Date.now(), // Timestamp para ordenar fácilmente
            userId: auth.currentUser.uid,
            userEmail: auth.currentUser.email
        };

        // Recopilación de datos específicos según el tipo de incidencia
        if (formData.tipoIncidencia === 'modulos') {
            formData.modulo = moduloSelect.value;
            formData.estanque = estanqueSelect.value;
            formData.oxigeno = oxigenoSelect.value;
            formData.valorOxigeno = valorOxigenoInput.value;
            formData.temperatura = temperaturaSelect.value;
            formData.valorTemperatura = valorTemperaturaInput.value;
            formData.conductividad = document.getElementById('conductividad').value;
            formData.turbidez = turbidezSelect.value;
            formData.valorTurbidez = valorTurbidezInput.value;
            formData.otros = Array.from(document.querySelectorAll('input[name="otros"]:checked')).map(cb => cb.value);
        } else if (formData.tipoIncidencia === 'sensores') {
            formData.sistemaSensor = sistemaSensorSelect.value;
            formData.sensorDetectado = sensorDetectadoSelect.value;
            formData.estadoSensor = document.getElementById('estadoSensor').value;
        }

        // Añadir datos de evaluación de riesgos
        formData.tiempoResolucion = document.getElementById('tiempoResolucion').value;
        formData.riesgoPeces = document.querySelector('input[name="riesgoPeces"]:checked')?.value;
        formData.perdidaEconomica = document.querySelector('input[name="perdidaEconomica"]:checked')?.value;
        formData.riesgoPersonas = document.querySelector('input[name="riesgoPersonas"]:checked')?.value;
        formData.observacion = document.getElementById('observacion').value;

        // Validación básica
        if (!formData.fechaHora || !formData.turno || !formData.centro || !formData.tipoIncidencia ||
            !formData.tiempoResolucion || !formData.riesgoPeces ||
            !formData.perdidaEconomica || !formData.riesgoPersonas) {
            showMessage('Por favor, complete todos los campos obligatorios del formulario.', 'error');
            return;
        }

        if (formData.tipoIncidencia === 'modulos' && (!formData.modulo || !formData.estanque)) {
            showMessage('Por favor, seleccione el módulo y el estanque.', 'error');
            return;
        }
        if (formData.tipoIncidencia === 'sensores' && (!formData.sistemaSensor || !formData.sensorDetectado || !formData.estadoSensor)) {
            showMessage('Por favor, seleccione el sistema, sensor y estado del sensor.', 'error');
            return;
        }

        console.log('Datos del formulario a registrar en Firebase:', formData);

        try {
            await incidenciasRef.push(formData);
            showMessage('Incidencia registrada con éxito.', 'success');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            document.getElementById('incidenciaForm').reset();
            // Resetear la visibilidad y contenido de las secciones
            hideSection(tipoIncidenciaSection);
            hideSection(modulosEstanquesSection);
            hideSection(sistemaSensoresSection);
            hideSection(evaluacionRiesgosSection);
            centroSelect.value = "";
            moduloSelect.innerHTML = '<option value="">Seleccione un módulo</option>';
            estanqueSelect.innerHTML = '<option value="">Seleccione un estanque</option>';
            sistemaSensorSelect.innerHTML = '<option value="">Seleccione un sistema</option>';
            sensorDetectadoSelect.innerHTML = '<option value="">Seleccione un sensor</option>';
            valorOxigenoInput.style.display = 'none';
            valorTemperaturaInput.style.display = 'none';
            valorTurbidezInput.style.display = 'none';
            setLocalDateTime();
        } catch (error) {
            console.error("Error al registrar incidencia en Firebase:", error);
            showMessage("Error al registrar la incidencia. Por favor, revise la consola para más detalles.", 'error');
        }
    }); // <-- ESTE CIERRE FALTABA

    // ----------------------------------------------------
    // -- Lógica para el botón "Generar Reporte del Día" --
    // ----------------------------------------------------
    generarReporteDiaBtn.addEventListener('click', () => {
        // Redirige a la página de reporte.
        // La página de reporte leerá directamente de Firebase.
        window.location.href = 'reporte.html';
    });



    // 9. Cargar los datos de los JSONs al iniciar la página
    loadData();

});