document.addEventListener('DOMContentLoaded', async () => {
    await verifyAuth();
    setupEventListeners();
    await loadDashboardStats();
    
    // Agregar botón de menú para móviles si es necesario
    if (window.innerWidth <= 992) {
        const mobileToggle = document.createElement('button');
        mobileToggle.className = 'mobile-menu-toggle';
        mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
        mobileToggle.addEventListener('click', toggleSidebar);
        document.body.appendChild(mobileToggle);
    }
});

// Función compartida para verificar autenticación
async function verifyAuth() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/admin/index.html';
        return false;
    }

    try {
        const response = await fetch('http://localhost:3000/api/admins/verify-token', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            localStorage.removeItem('adminToken');
            window.location.href = '/admin/index.html';
            return false;
        }
        
        // Mostrar información del usuario
        const adminData = JSON.parse(localStorage.getItem('adminData'));
        if (adminData) {
            const userAvatar = document.getElementById('userAvatar');
            const userName = document.querySelector('.user-name');
            
            if (userAvatar) userAvatar.src = adminData.avatar || '/admin/assets/images.png';
            if (userName) userName.textContent = adminData.username || 'Administrador';
        }
        
        return true;
    } catch (error) {
        console.error('Error verificando token:', error);
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/index.html';
        return false;
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Cerrar sesión
    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        window.location.href = '/admin/index.html';
    });
    
    // Toggle sidebar con avatar
    document.getElementById('userAvatar')?.addEventListener('click', toggleSidebar);
    
    // Toggle sidebar con botón
    document.getElementById('sidebarToggle')?.addEventListener('click', toggleSidebar);
    
    // Redimensionamiento
    window.addEventListener('resize', setupResponsive);
}

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

// Cargar estadísticas del dashboard
async function loadDashboardStats() {
    try {
        showLoading();

        const token = localStorage.getItem('adminToken');
        const response = await fetch('http://localhost:3000/api/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Error al cargar estadísticas');

        const stats = await response.json();
        
        // Actualizar la UI con las estadísticas
        document.getElementById('thesisCount').textContent = stats.thesisCount || '0';
        document.getElementById('adminCount').textContent = stats.adminCount || '0';
        
        // Puedes agregar más actualizaciones de UI aquí según tus necesidades

    } catch (error) {
        console.error('Error cargando estadísticas:', error);
        alert('Error al cargar las estadísticas del dashboard');
    } finally {
        hideLoading();
    }
}

// Mostrar loading
function showLoading() {
    document.querySelector('.loading-overlay').style.display = 'flex';
}

function hideLoading() {
    document.querySelector('.loading-overlay').style.display = 'none';
}