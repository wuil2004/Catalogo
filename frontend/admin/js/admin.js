// Variables globales
let currentPage = 1;
let itemsPerPage = 10;
let totalItems = 0;
let originalData = [];
let filteredData = [];
let currentData = [];

// Inicialización al cargar el DOM
document.addEventListener('DOMContentLoaded', async () => {
    await verifyAuth();
    setupEventListeners();
    await loadAdmins();
    setupAdminModal();
    setupResponsive();
    
    // Agregar botón de menú para móviles
    if (window.innerWidth <= 992) {
        const mobileToggle = document.createElement('button');
        mobileToggle.className = 'mobile-menu-toggle';
        mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
        mobileToggle.addEventListener('click', toggleSidebar);
        document.body.appendChild(mobileToggle);
    }
});

// Verificar autenticación (función compartida)
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
    // Paginación
    document.getElementById('firstPage').addEventListener('click', () => {
        currentPage = 1;
        displayPage(currentPage);
    });

    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayPage(currentPage);
        }
    });

    document.getElementById('nextPage').addEventListener('click', () => {
        if (currentPage * itemsPerPage < totalItems) {
            currentPage++;
            displayPage(currentPage);
        }
    });

    document.getElementById('lastPage').addEventListener('click', () => {
        currentPage = Math.ceil(totalItems / itemsPerPage);
        displayPage(currentPage);
    });

    document.getElementById('itemsPerPage').addEventListener('change', (e) => {
        itemsPerPage = parseInt(e.target.value);
        currentPage = 1;
        displayPage(currentPage);
    });

    // Cerrar sesión
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        window.location.href = '/admin/index.html';
    });
    
    // Toggle sidebar con avatar
    document.getElementById('userAvatar').addEventListener('click', toggleSidebar);
    
    // Toggle sidebar con botón
    document.getElementById('sidebarToggle').addEventListener('click', toggleSidebar);
    
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

// Cargar administradores
async function loadAdmins() {
    try {
        showLoading();

        const token = localStorage.getItem('adminToken');
        const response = await fetch('http://localhost:3000/api/admins', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Error al cargar administradores');

        originalData = await response.json();
        filteredData = [...originalData];
        totalItems = filteredData.length;
        
        updatePagination();
        displayPage(currentPage);

    } catch (error) {
        console.error('Error cargando administradores:', error);
        showError(error.message || 'Error al cargar administradores');
    } finally {
        hideLoading();
    }
}

// Mostrar página específica
function displayPage(page) {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    currentData = filteredData.slice(start, end);

    renderAdminsTable(currentData);

    document.getElementById('startItem').textContent = start + 1;
    document.getElementById('endItem').textContent = Math.min(end, totalItems);
    document.getElementById('totalItems').textContent = totalItems;

    document.getElementById('firstPage').disabled = page === 1;
    document.getElementById('prevPage').disabled = page === 1;
    document.getElementById('nextPage').disabled = currentPage * itemsPerPage >= totalItems;
    document.getElementById('lastPage').disabled = currentPage * itemsPerPage >= totalItems;

    updatePageNumbers(page);
}

// Actualizar números de página
function updatePageNumbers(currentPage) {
    const pageNumbers = document.querySelector('.page-numbers');
    pageNumbers.innerHTML = '';

    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
        for (let i = 1; i <= totalPages; i++) {
            addPageButton(i, i === currentPage);
        }
    } else {
        if (currentPage <= 3) {
            for (let i = 1; i <= 4; i++) {
                addPageButton(i, i === currentPage);
            }
            pageNumbers.appendChild(createEllipsis());
            addPageButton(totalPages, false);
        } else if (currentPage >= totalPages - 2) {
            addPageButton(1, false);
            pageNumbers.appendChild(createEllipsis());
            for (let i = totalPages - 3; i <= totalPages; i++) {
                addPageButton(i, i === currentPage);
            }
        } else {
            addPageButton(1, false);
            if (currentPage > 3) pageNumbers.appendChild(createEllipsis());

            for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                addPageButton(i, i === currentPage);
            }

            if (currentPage < totalPages - 2) pageNumbers.appendChild(createEllipsis());
            addPageButton(totalPages, false);
        }
    }
}

function addPageButton(pageNum, isActive) {
    const btn = document.createElement('button');
    btn.className = 'page-btn' + (isActive ? ' active' : '');
    btn.textContent = pageNum;
    btn.onclick = () => {
        currentPage = pageNum;
        displayPage(currentPage);
    };
    document.querySelector('.page-numbers').appendChild(btn);
}

function createEllipsis() {
    const span = document.createElement('span');
    span.textContent = '...';
    return span;
}

// Renderizar tabla de administradores
function renderAdminsTable(admins) {
    const tbody = document.querySelector('#adminsTable tbody');
    tbody.innerHTML = '';

    if (admins.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="3" style="text-align: center;">No se encontraron administradores</td>`;
        tbody.appendChild(row);
        return;
    }

    admins.forEach(admin => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${admin.id || 'N/A'}</td>
            <td>${admin.username || 'N/A'}</td>
            <td class="column-actions">
                <button class="btn-edit" onclick="openEditModal(${admin.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-delete" onclick="confirmDelete(${admin.id})" title="Eliminar">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

// Configurar modal de administrador
function setupAdminModal() {
    const modal = document.getElementById('adminModal');
    if (!modal) return;

    // Botón "Nuevo Admin"
    document.getElementById('addAdminBtn')?.addEventListener('click', () => {
        document.getElementById('modalAdminTitle').innerHTML = '<i class="fas fa-user-plus"></i> Nuevo Administrador';
        document.getElementById('adminForm').reset();
        document.getElementById('adminPassword').required = true;
        modal.style.display = 'block';
    });

    // Cerrar modal
    modal.querySelector('.close-modal').addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Enviar formulario
    document.getElementById('adminForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveAdmin();
    });
}

// Abrir modal para editar
async function openEditModal(adminId) {
    try {
        showLoading();

        const token = localStorage.getItem('adminToken');
        const response = await fetch(`http://localhost:3000/api/admins/${adminId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Error al cargar administrador');

        const admin = await response.json();
        
        document.getElementById('modalAdminTitle').innerHTML = '<i class="fas fa-user-edit"></i> Editar Administrador';
        document.getElementById('adminId').value = admin.id;
        document.getElementById('adminUsername').value = admin.username;
        document.getElementById('adminPassword').required = false;
        document.getElementById('formError').style.display = 'none';
        
        document.getElementById('adminModal').style.display = 'block';

    } catch (error) {
        console.error('Error al editar administrador:', error);
        showError(error.message);
    } finally {
        hideLoading();
    }
}

// Guardar administrador
async function saveAdmin() {
    try {
        const form = document.getElementById('adminForm');
        const formData = {
            id: form.adminId.value,
            username: form.adminUsername.value.trim(),
            password: form.adminPassword.value || undefined
        };

        if (!formData.username) throw new Error('Usuario es requerido');
        if (!formData.id && !formData.password) throw new Error('Contraseña es requerida para nuevos administradores');

        showLoading();
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

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al guardar administrador');
        }

        document.getElementById('adminModal').style.display = 'none';
        await loadAdmins();

    } catch (error) {
        console.error('Error al guardar administrador:', error);
        document.getElementById('formError').textContent = error.message;
        document.getElementById('formError').style.display = 'block';
    } finally {
        hideLoading();
    }
}

// Confirmar eliminación
async function confirmDelete(adminId) {
    if (!confirm('¿Estás seguro de eliminar este administrador?')) return;
    
    try {
        showLoading();
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`http://localhost:3000/api/admins/${adminId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Error al eliminar administrador');

        await loadAdmins();
    } catch (error) {
        console.error('Error al eliminar administrador:', error);
        showError(error.message);
    } finally {
        hideLoading();
    }
}

// Actualizar paginación
function updatePagination() {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    document.getElementById('firstPage').disabled = currentPage === 1;
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages || totalPages === 0;
    document.getElementById('lastPage').disabled = currentPage === totalPages || totalPages === 0;
}

// Mostrar loading
function showLoading() {
    document.querySelector('.loading-overlay').style.display = 'flex';
}

function hideLoading() {
    document.querySelector('.loading-overlay').style.display = 'none';
}

// Mostrar error
function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        setTimeout(() => errorElement.style.display = 'none', 5000);
    } else {
        alert(message);
    }
}

// Funciones globales
window.openEditModal = openEditModal;
window.confirmDelete = confirmDelete;