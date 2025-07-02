document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Verificar autenticación (función compartida, podrías moverla a un archivo común luego)
        const token = localStorage.getItem('adminToken');
        if (!token) throw new Error('No autenticado');

        const tokenValid = await verifyToken(token);
        if (!tokenValid) throw new Error('Token inválido');

        // Mostrar usuario actual
        const adminData = JSON.parse(localStorage.getItem('adminData'));
        if (adminData && document.getElementById('currentUser')) {
            document.getElementById('currentUser').textContent = `Bienvenido, ${adminData.username}`;
        }

        // Aquí podrías cargar estadísticas del dashboard si las tuvieras
        // await loadDashboardStats();

    } catch (error) {
        console.error('Error de autenticación:', error);
        logout();
    }
});

// Función para verificar el token (repetida, ideal moverla a un archivo común)
async function verifyToken(token) {
    try {
        const response = await fetch('http://localhost:3000/api/admins/verify-token', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.ok;
    } catch (error) {
        console.error('Error verificando token:', error);
        return false;
    }
}

// Función para cerrar sesión (compartida)
function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    window.location.href = '/admin/index.html';
}

// Ejemplo de función específica del dashboard (si necesitas cargar datos)
async function loadDashboardStats() {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch('http://localhost:3000/api/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const stats = await response.json();
        document.getElementById('dashboardStats').innerHTML = `
            <p>Tesis registradas: ${stats.thesisCount}</p>
            <p>Administradores: ${stats.adminCount}</p>
        `;
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}