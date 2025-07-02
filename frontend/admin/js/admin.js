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

// Verificar token de autenticación
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

// Cerrar sesión
function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    window.location.href = '/admin/index.html';
}

// ====================== Funciones CRUD para Administradores ======================
async function loadAdmins() {
    try {
        showLoading(true);
        const token = localStorage.getItem('adminToken');
        const response = await fetch('http://localhost:3000/api/admins', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error(await response.text());
        
        const admins = await response.json();
        renderAdminsTable(admins);
        
    } catch (error) {
        showError(error.message || 'Error al cargar administradores');
    } finally {
        showLoading(false);
    }
}

function renderAdminsTable(admins) {
    const tableBody = document.querySelector('#adminsTable tbody');
    tableBody.innerHTML = admins.length === 0 
        ? '<tr><td colspan="3">No hay administradores</td></tr>'
        : admins.map(admin => `
            <tr>
                <td>${admin.id}</td>
                <td>${admin.username}</td>
                <td class="actions">
                    <button class="btn btn-primary edit-btn" data-id="${admin.id}">Editar</button>
                    <button class="btn btn-danger delete-btn" data-id="${admin.id}">Eliminar</button>
                </td>
            </tr>
        `).join('');

    // Agregar event listeners
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => openEditModal(e.target.dataset.id));
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => confirmDelete(e.target.dataset.id));
    });
}

function setupAdminModal() {
    const modal = document.getElementById('adminModal');
    if (!modal) return;

    // Botón "Nuevo Admin"
    document.getElementById('addAdminBtn')?.addEventListener('click', () => {
        document.getElementById('modalTitle').textContent = 'Nuevo Administrador';
        document.getElementById('adminForm').reset();
        document.getElementById('adminPassword').required = true;
        modal.style.display = 'block';
    });

    // Cerrar modal
    modal.querySelector('.close').addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Cerrar al hacer clic fuera del modal
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Enviar formulario
    document.getElementById('adminForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveAdmin();
    });
}

async function openEditModal(adminId) {
    try {
        showLoading(true);
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`http://localhost:3000/api/admins/${adminId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error(await response.text());
        
        const admin = await response.json();
        document.getElementById('modalTitle').textContent = 'Editar Administrador';
        document.getElementById('adminId').value = admin.id;
        document.getElementById('adminUsername').value = admin.username;
        document.getElementById('adminPassword').required = false;
        document.getElementById('formError').style.display = 'none';
        
        document.getElementById('adminModal').style.display = 'block';
    } catch (error) {
        showError(error.message);
    } finally {
        showLoading(false);
    }
}

async function saveAdmin() {
    try {
        const form = document.getElementById('adminForm');
        const formData = {
            id: form.adminId.value,
            username: form.adminUsername.value.trim(),
            password: form.adminPassword.value || undefined
        };

        if (!formData.username) throw new Error('Usuario es requerido');
        if (!formData.id && !formData.password) throw new Error('Contraseña es requerida');

        const token = localStorage.getItem('adminToken');
        const response = await fetch(
            formData.id ? `http://localhost:3000/api/admins/${formData.id}` : 'http://localhost:3000/api/admins/register',
            {
                method: formData.id ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            }
        );

        if (!response.ok) throw new Error(await response.text());

        document.getElementById('adminModal').style.display = 'none';
        await loadAdmins();

    } catch (error) {
        document.getElementById('formError').textContent = error.message;
        document.getElementById('formError').style.display = 'block';
    }
}

async function confirmDelete(adminId) {
    if (!confirm('¿Estás seguro de eliminar este administrador?')) return;
    
    try {
        showLoading(true);
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`http://localhost:3000/api/admins/${adminId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error(await response.text());
        await loadAdmins();

    } catch (error) {
        showError(error.message);
    } finally {
        showLoading(false);
    }
}

// ====================== Helpers ======================
function showLoading(show) {
    document.getElementById('loadingMessage').style.display = show ? 'block' : 'none';
    document.querySelector('.table-container').style.display = show ? 'none' : 'block';
}

function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    setTimeout(() => errorElement.style.display = 'none', 5000);
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

        // Cargar lista de administradores
        await loadAdmins();
        setupAdminModal();

    } catch (error) {
        console.error('Error de autenticación:', error);
        logout();
    }
});

// Configurar redimensionamiento
window.addEventListener('resize', setupResponsive);