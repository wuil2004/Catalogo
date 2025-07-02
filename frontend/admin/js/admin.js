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
        renderAdminsCards(admins);
        
    } catch (error) {
        showError(error.message || 'Error al cargar administradores');
    } finally {
        showLoading(false);
    }
}

function renderAdminsCards(admins) {
    const container = document.getElementById('adminsCardsContainer');
    
    if (admins.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-shield"></i>
                <h3>No hay administradores</h3>
                <p>Agrega un nuevo administrador para comenzar</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = admins.map(admin => `
        <div class="admin-card" data-id="${admin.id}">
            <div class="card-header">
                <div class="card-icon">
                    <i class="fas fa-user-cog"></i>
                </div>
                <h3>${admin.username}</h3>
            </div>
            <div class="card-body">
                <div class="card-detail">
                    <i class="fas fa-id-card"></i>
                    <span>ID: ${admin.id}</span>
                </div>
                
            </div>
            <div class="card-footer">
                <button class="btn btn-primary btn-sm edit-btn" data-id="${admin.id}">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn btn-danger btn-sm delete-btn" data-id="${admin.id}">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        </div>
    `).join('');

    // Agregar event listeners
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => openEditModal(e.target.closest('button').dataset.id));
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => confirmDelete(e.target.closest('button').dataset.id));
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

    // Botón cancelar
    document.getElementById('cancelBtn')?.addEventListener('click', () => {
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

function setupConfirmModal() {
    const modal = document.getElementById('confirmModal');
    let currentAdminId = null;

    // Configurar botones
    document.getElementById('cancelDeleteBtn')?.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    document.getElementById('confirmDeleteBtn')?.addEventListener('click', async () => {
        if (currentAdminId) {
            await deleteAdmin(currentAdminId);
            modal.style.display = 'none';
            currentAdminId = null;
        }
    });

    // Cerrar al hacer clic fuera del modal
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            currentAdminId = null;
        }
    });

    // Función para abrir el modal de confirmación
    window.confirmDelete = (adminId) => {
        currentAdminId = adminId;
        document.getElementById('confirmMessage').textContent = 
            `¿Estás seguro de eliminar este administrador? Esta acción no se puede deshacer.`;
        modal.style.display = 'block';
    };
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

async function deleteAdmin(adminId) {
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
    document.getElementById('loadingMessage').style.display = show ? 'flex' : 'none';
    document.getElementById('adminsCardsContainer').style.display = show ? 'none' : 'grid';
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
        }

        // Configurar modales
        setupAdminModal();
        setupConfirmModal();

        // Cargar lista de administradores
        await loadAdmins();

    } catch (error) {
        console.error('Error de autenticación:', error);
        logout();
    }
});

// Configurar redimensionamiento
window.addEventListener('resize', setupResponsive);