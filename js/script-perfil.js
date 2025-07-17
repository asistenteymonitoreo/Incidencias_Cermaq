document.addEventListener('DOMContentLoaded', () => {
    const profileItems = document.querySelectorAll('.profile-item');
    const manageProfilesButton = document.querySelector('.manage-profiles-button');

    // Manejar el clic en cada perfil
    profileItems.forEach(item => {
        item.addEventListener('click', () => {
            const profileId = item.dataset.profileId;

            // Si se hace clic en 'Agregar Perfil', mostramos una alerta y no redirigimos.
            if (profileId === 'add') {
                alert('Funcionalidad para agregar nuevo perfil (por implementar)');
                return; 
            }

            // Para cualquier otro perfil, guardamos el nombre y redirigimos.
            const profileName = item.querySelector('.profile-name').textContent;
            localStorage.setItem('selectedProfileName', profileName);

            console.log(`Perfil "${profileName}" seleccionado. Redirigiendo a formulario.html`);
            // Retrasar la redirección para asegurar que localStorage se guarde
            setTimeout(() => {
                window.location.href = 'formulario.html';
            }, 50);
        });
    });

    // Manejar el clic en el botón "Gestionar Perfiles"
    if (manageProfilesButton) {
        manageProfilesButton.addEventListener('click', () => {
            alert('Funcionalidad para gestionar perfiles (por implementar)');
            // Aquí podrías redirigir a una página para editar/eliminar perfiles
        });
    }
});
