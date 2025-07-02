// Alternar sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const isMobile = window.innerWidth <= 992;
    
    if (isMobile) {
        sidebar.classList.toggle('show');
    } else {
        sidebar.classList.toggle('collapsed');
    }
}

// Configurar event listeners para el sidebar
function setupSidebar() {
    // Toggle sidebar con avatar
    document.getElementById('userAvatar')?.addEventListener('click', toggleSidebar);
    
    // Toggle sidebar con botón
    document.getElementById('sidebarToggle')?.addEventListener('click', toggleSidebar);
    
    // Cerrar sesión
    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });
    
    // Configurar responsividad
    setupResponsive();
}

// Configurar responsividad
function setupResponsive() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    if (window.innerWidth <= 992) {
        if (!mobileToggle) {
            const newToggle = document.createElement('button');
            newToggle.className = 'mobile-menu-toggle';
            newToggle.innerHTML = '<i class="fas fa-bars"></i>';
            newToggle.addEventListener('click', toggleSidebar);
            document.body.appendChild(newToggle);
        } else {
            mobileToggle.style.display = 'block';
        }
    } else if (mobileToggle) {
        mobileToggle.style.display = 'none';
    }
}

// Función para cargar estadísticas del dashboard
async function loadDashboardStats() {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch('http://localhost:3000/api/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Error al cargar estadísticas');
        
        const stats = await response.json();
        renderStats(stats);
        
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('dashboardStats').innerHTML = `
            <div class="error-message">
                Error al cargar estadísticas: ${error.message}
            </div>
        `;
    }
}

// Función para mostrar las estadísticas
function renderStats(stats) {
    const statsContainer = document.getElementById('dashboardStats');
    
    statsContainer.innerHTML = `
        <div class="stat-card">
            <h3>Tesis registradas</h3>
            <div class="value">${stats.thesisCount || 0}</div>
            <div class="change ${stats.thesisChange >= 0 ? 'positive' : 'negative'}">
                <i class="fas fa-${stats.thesisChange >= 0 ? 'arrow-up' : 'arrow-down'}"></i>
                ${Math.abs(stats.thesisChange)}% este mes
            </div>
        </div>
        
        <div class="stat-card">
            <h3>Administradores</h3>
            <div class="value">${stats.adminCount || 0}</div>
            <div class="change ${stats.adminChange >= 0 ? 'positive' : 'negative'}">
                <i class="fas fa-${stats.adminChange >= 0 ? 'arrow-up' : 'arrow-down'}"></i>
                ${Math.abs(stats.adminChange)}% este mes
            </div>
        </div>
        
        <div class="stat-card">
            <h3>Usuarios activos</h3>
            <div class="value">${stats.activeUsers || 0}</div>
            <div class="change ${stats.usersChange >= 0 ? 'positive' : 'negative'}">
                <i class="fas fa-${stats.usersChange >= 0 ? 'arrow-up' : 'arrow-down'}"></i>
                ${Math.abs(stats.usersChange)}% este mes
            </div>
        </div>
        
        <div class="stat-card">
            <h3>Última actividad</h3>
            <div class="value">${stats.lastActivity || 'N/A'}</div>
            <div class="change">
                <i class="fas fa-clock"></i>
                Actualizado ahora
            </div>
        </div>
    `;
}

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Verificar autenticación
        const token = localStorage.getItem('adminToken');
        if (!token) throw new Error('No autenticado');

        const tokenValid = await verifyToken(token);
        if (!tokenValid) throw new Error('Token inválido');

        // Configurar sidebar
        setupSidebar();
        
        // Mostrar usuario actual
        const adminData = JSON.parse(localStorage.getItem('adminData'));
        if (adminData) {
            const userNameElement = document.querySelector('.user-name');
            if (userNameElement) {
                userNameElement.textContent = adminData.username;
            }
            if (document.getElementById('currentUser')) {
                document.getElementById('currentUser').textContent = `Bienvenido, ${adminData.username}`;
            }
        }

        // Cargar estadísticas del dashboard
        await loadDashboardStats();

    } catch (error) {
        console.error('Error de autenticación:', error);
        logout();
    }
});

// Función para verificar el token
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

// Función para cerrar sesión
function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    window.location.href = '/admin/index.html';
}

// Configurar redimensionamiento
window.addEventListener('resize', setupResponsive);