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

            // Para cualquier otro perfil, redirigimos al formulario.
            console.log(`Perfil "${item.querySelector('.profile-name').textContent}" seleccionado. Redirigiendo a formulario.html`);
            window.location.href = 'formulario.html';
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
