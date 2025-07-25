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
            window.location.href = 'reporte.html';
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
        sectionElement.classList.remove('hidden');
    }
    function hideSection(sectionElement) {
        sectionElement.classList.add('hidden');
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
    valorOxigenoInput.style.display = 'none';
    valorTemperaturaInput.style.display = 'none';
    valorTurbidezInput.style.display = 'none';

    // Aquí puedes agregar el resto de la lógica de eventos y validaciones del formulario
});
