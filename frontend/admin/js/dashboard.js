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

// Función para cargar los registros de tesis
async function loadThesisCards() {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch('http://localhost:3000/api/registros/admin', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Error al cargar registros');
        
        const registros = await response.json();
        renderThesisCards(registros);
        
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('thesisCards').innerHTML = `
            <div class="error-message">
                Error al cargar registros: ${error.message}
            </div>
        `;
    }
}

// Función para renderizar las tarjetas
function renderThesisCards(registros) {
    const container = document.getElementById('thesisCards');
    container.innerHTML = '';

    if (registros.length === 0) {
        container.innerHTML = '<p class="no-results">No hay registros de tesis disponibles</p>';
        return;
    }

    // Mapeo de colores
    const colorMap = {
        "Azul": "#3498db",
        "Rojo": "#e74c3c",
        "Verde": "#2ecc71",
        "Negro": "#2c3e50",
        "Default": "#95a5a6"
    };

    registros.forEach(registro => {
        const card = document.createElement('div');
        card.className = 'bibliographic-card';
        
        card.innerHTML = `
            <div class="card-image">
                ${registro.imagen 
                    ? `<img src="/uploads/${registro.imagen}" alt="Portada de tesis">`
                    : `<div class="placeholder"><i class="fas fa-book-open"></i></div>`
                }
            </div>
            <div class="card-content">
                <span class="card-id">${registro.N_Impreso_Digital}</span>
                <h3 class="card-title">${registro.Titulo}</h3>
                <p class="card-author"><i class="fas fa-user"></i> ${registro.Nombre_1}</p>
                <div class="card-meta">
                    <span><i class="fas fa-graduation-cap"></i> ${registro.Carrera}</span>
                    <span>
                        <i class="fas fa-palette"></i>
                        <span class="card-color" style="background: ${colorMap[registro.Color] || colorMap.Default};"></span>
                        ${registro.Color}
                    </span>
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });
}

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

        // Cargar tarjetas de tesis
        await loadThesisCards();

    } catch (error) {
        console.error('Error de autenticación:', error);
        logout();
    }
});

// Configurar redimensionamiento
window.addEventListener('resize', setupResponsive);