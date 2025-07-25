// js/auth.js (para la página de inicio de sesión - index.html)

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
const auth = firebase.auth();

// ----------------------------------------------------
// -- Lógica de Autenticación Manual --
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');


    // Observador de estado de autenticación (redirige si ya está logueado)
    auth.onAuthStateChanged(user => {
        if (user) {
            console.log('Usuario ya logueado, redirigiendo a perfil.html');
            window.location.href = 'perfil.html';
        }
    });

    // Manejador del formulario de inicio de sesión
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        loginError.classList.add('hidden'); // Ocultar errores previos

        const email = loginForm.email.value;
        const password = loginForm.password.value;

        try {
            // Intentar iniciar sesión con el método de Firebase
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            console.log('Inicio de sesión exitoso para:', userCredential.user.email);
            window.location.href = 'perfil.html'; // Redirección inmediata
        } catch (error) {
            // Manejar errores de inicio de sesión
            console.error('Error de inicio de sesión:', error.code, error.message);
            let errorMessage = 'Ocurrió un error. Por favor, inténtelo de nuevo.';
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                errorMessage = 'El correo o la contraseña son incorrectos.';
            }
            loginError.textContent = errorMessage;
            loginError.classList.remove('hidden');
        }
    });


});
