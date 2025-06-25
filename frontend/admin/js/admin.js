document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticación y token válido
    try {
        const token = localStorage.getItem('adminToken');
        if (!token) throw new Error('No autenticado');

        // Verificar token con el servidor
        const tokenValid = await verifyToken(token);
        if (!tokenValid) throw new Error('Token inválido');

        // Mostrar usuario actual
        const adminData = JSON.parse(localStorage.getItem('adminData'));
        if (adminData && document.getElementById('currentUser')) {
            document.getElementById('currentUser').textContent = `Bienvenido, ${adminData.username}`;
        }

        // Cargar lista de administradores
        await loadAdmins();
        setupAdminModal();

    } catch (error) {
        console.error('Error de autenticación:', error);
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        window.location.href = '/admin/index.html';
    }
});

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

async function loadAdmins() {
    try {
        showLoading(true);
        const token = localStorage.getItem('adminToken');
        const response = await fetch('http://localhost:3000/api/admins', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al cargar administradores');
        }
        
        const admins = await response.json();
        renderAdminsTable(admins);
        
    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
    } finally {
        showLoading(false);
    }
}

function renderAdminsTable(admins) {
    const tableBody = document.querySelector('#adminsTable tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (admins.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" class="text-center">No hay administradores registrados</td></tr>';
        return;
    }
    
    admins.forEach(admin => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${admin.id}</td>
            <td>${admin.username}</td>
            <td class="actions">
                <button class="btn btn-primary edit-btn" data-id="${admin.id}">Editar</button>
                <button class="btn btn-danger delete-btn" data-id="${admin.id}">Eliminar</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Agregar event listeners a los botones
    addEditEventListeners();
    addDeleteEventListeners();
}

function addEditEventListeners() {
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const adminId = e.target.getAttribute('data-id');
            openEditModal(adminId);
        });
    });
}

function addDeleteEventListeners() {
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const adminId = e.target.getAttribute('data-id');
            confirmDelete(adminId);
        });
    });
}

function setupAdminModal() {
    const modal = document.getElementById('adminModal');
    if (!modal) return;
    
    const addBtn = document.getElementById('addAdminBtn');
    const closeBtn = modal.querySelector('.close');
    
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            resetModalForm();
            modal.style.display = 'block';
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    const form = document.getElementById('adminForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveAdmin();
        });
    }
}

function resetModalForm() {
    const modal = document.getElementById('adminModal');
    if (!modal) return;
    
    modal.querySelector('#modalTitle').textContent = 'Nuevo Administrador';
    modal.querySelector('#adminId').value = '';
    modal.querySelector('#adminUsername').value = '';
    modal.querySelector('#adminPassword').value = '';
    modal.querySelector('#adminPassword').required = true;
    
    const formError = modal.querySelector('#formError');
    if (formError) {
        formError.style.display = 'none';
    }
}

async function openEditModal(adminId) {
    try {
        showLoading(true);
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`http://localhost:3000/api/admins/${adminId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al cargar administrador');
        }
        
        const admin = await response.json();
        const modal = document.getElementById('adminModal');
        
        if (modal) {
            modal.querySelector('#modalTitle').textContent = 'Editar Administrador';
            modal.querySelector('#adminId').value = admin.id;
            modal.querySelector('#adminUsername').value = admin.username;
            modal.querySelector('#adminPassword').value = '';
            modal.querySelector('#adminPassword').required = false;
            
            const formError = modal.querySelector('#formError');
            if (formError) {
                formError.style.display = 'none';
            }
            
            modal.style.display = 'block';
        }
        
    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
    } finally {
        showLoading(false);
    }
}

async function saveAdmin() {
    try {
        const token = localStorage.getItem('adminToken');
        const form = document.getElementById('adminForm');
        if (!form) throw new Error('Formulario no encontrado');
        
        const id = form.querySelector('#adminId').value;
        const username = form.querySelector('#adminUsername').value.trim();
        const password = form.querySelector('#adminPassword').value;
        const formError = form.querySelector('#formError');
        
        // Validaciones
        if (!username) throw new Error('El nombre de usuario es requerido');
        if (!id && !password) throw new Error('La contraseña es requerida para nuevos administradores');
        
        const url = id ? `http://localhost:3000/api/admins/${id}` : 'http://localhost:3000/api/admins/register';
        const method = id ? 'PUT' : 'POST';
        
        const body = { username };
        if (password) body.password = password;
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al guardar');
        }
        
        document.getElementById('adminModal').style.display = 'none';
        await loadAdmins();
        
    } catch (error) {
        console.error('Error:', error);
        const formError = document.getElementById('formError');
        if (formError) {
            formError.textContent = error.message;
            formError.style.display = 'block';
        }
    }
}

async function confirmDelete(adminId) {
    try {
        const currentAdmin = JSON.parse(localStorage.getItem('adminData'));
        if (currentAdmin && currentAdmin.id === parseInt(adminId)) {
            showError('No puedes eliminarte a ti mismo');
            return;
        }
        
        if (!confirm('¿Está seguro de eliminar este administrador?')) return;
        
        showLoading(true);
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`http://localhost:3000/api/admins/${adminId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al eliminar');
        }
        
        await loadAdmins();
        
    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
    } finally {
        showLoading(false);
    }
}

function showLoading(show) {
    const loadingElement = document.getElementById('loadingMessage');
    const tableElement = document.querySelector('.table-container');
    
    if (loadingElement) loadingElement.style.display = show ? 'block' : 'none';
    if (tableElement) tableElement.style.display = show ? 'none' : 'block';
}

function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        setTimeout(() => errorElement.style.display = 'none', 5000);
    }
}