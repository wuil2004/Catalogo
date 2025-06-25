document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('adminToken');
    const currentPath = window.location.pathname;
    const isLoginPage = ['/admin', '/admin/', '/admin/index.html'].includes(currentPath);

    // Verificar token solo si no estamos en la página de login
    if (!isLoginPage) {
        if (!token) {
            window.location.href = '/admin/index.html';
            return;
        }

        // Verificar si el token es válido
        const isValid = await verifyToken(token);
        if (!isValid) {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminData');
            window.location.href = '/admin/index.html';
            return;
        }
    }

    // Si estamos en login y tenemos token válido, redirigir
    if (isLoginPage && token) {
        const isValid = await verifyToken(token);
        if (isValid) {
            window.location.href = '/admin/dashboard.html';
            return;
        } else {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminData');
        }
    }

    // Manejar formulario de login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Manejar logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});

async function verifyToken(token) {
    try {
        const response = await fetch('http://localhost:3000/api/admins/verify-token', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('errorMessage');
    
    // Validación básica en el cliente
    if (!username || !password) {
        errorElement.textContent = 'Usuario y contraseña son requeridos';
        errorElement.style.display = 'block';
        return;
    }
    
    try {
        const response = await fetch('http://localhost:3000/api/admins/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('adminToken', data.token);
            localStorage.setItem('adminData', JSON.stringify({
                username: data.username,
                id: data.id
            }));
            
            // Pequeño retraso para mejor experiencia de usuario
            setTimeout(() => {
                window.location.href = '/admin/dashboard.html';
            }, 500);
        } else {
            errorElement.textContent = data.message || 'Credenciales incorrectas';
            errorElement.style.display = 'block';
        }
    } catch (error) {
        console.error('Error:', error);
        errorElement.textContent = 'Error al conectar con el servidor';
        errorElement.style.display = 'block';
    }
}

function handleLogout(e) {
    e.preventDefault();
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    window.location.href = '/admin/index.html';
}