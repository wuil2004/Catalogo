/**
 * Sistema de Autenticación Administrativa TESJI
 * Controlador principal de autenticación y gestión de sesión
 */

class AuthController {
    constructor() {
        this.init();
    }

    async init() {
        await this.checkAuthState();
        this.setupEventListeners();
    }

    async checkAuthState() {
        const token = localStorage.getItem('adminToken');
        const currentPath = window.location.pathname;
        const isLoginPage = ['/admin', '/admin/', '/admin/index.html'].includes(currentPath);

        if (!isLoginPage && !token) {
            this.redirectToLogin();
            return;
        }

        if (!isLoginPage) {
            const isValid = await this.verifyToken(token);
            if (!isValid) {
                this.clearSession();
                this.redirectToLogin();
                return;
            }
        }

        if (isLoginPage && token) {
            const isValid = await this.verifyToken(token);
            if (isValid) {
                this.redirectToDashboard();
            } else {
                this.clearSession();
            }
        }
    }

    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
            this.setupPasswordToggle();
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => this.handleLogout(e));
        }
    }

    setupPasswordToggle() {
        const togglePassword = document.querySelector('.toggle-password');
        const passwordInput = document.getElementById('password');
        
        if (togglePassword && passwordInput) {
            togglePassword.addEventListener('click', () => {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                
                togglePassword.textContent = type === 'password' ? '👀' : '🙈';
                togglePassword.setAttribute('aria-label', type === 'password' ? 'Mostrar contraseña' : 'Ocultar contraseña');
                
                passwordInput.focus();
            });
            /*
            passwordInput.addEventListener('blur', () => {
                if (passwordInput.getAttribute('type') === 'text') {
                    passwordInput.setAttribute('type', 'password');
                    togglePassword.textContent = '👁️';
                    togglePassword.setAttribute('aria-label', 'Mostrar contraseña');
                }
            });*/
        }
    }

    async verifyToken(token) {
        try {
            const response = await fetch('http://localhost:3000/api/admins/verify-token', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return response.ok;
        } catch (error) {
            console.error('Error verifying token:', error);
            return false;
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const errorElement = document.getElementById('errorMessage');
        
        if (!username || !password) {
            this.showError(errorElement, 'Usuario y contraseña son requeridos');
            return;
        }
        
        try {
            this.setLoadingState(true);
            
            const response = await fetch('http://localhost:3000/api/admins/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.saveSession(data);
                setTimeout(() => this.redirectToDashboard(), 500);
            } else {
                this.showError(errorElement, data.message || 'Credenciales incorrectas');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError(errorElement, 'Error al conectar con el servidor');
        } finally {
            this.setLoadingState(false);
        }
    }

    setLoadingState(isLoading) {
        const loginBtn = document.querySelector('.btn-login');
        if (loginBtn) {
            if (isLoading) {
                loginBtn.classList.add('loading');
                loginBtn.disabled = true;
            } else {
                loginBtn.classList.remove('loading');
                loginBtn.disabled = false;
            }
        }
    }

    showError(element, message) {
        if (element) {
            element.textContent = message;
            element.style.display = 'block';
            
            // Auto-ocultar el mensaje después de 5 segundos
            setTimeout(() => {
                element.style.display = 'none';
            }, 5000);
        }
    }

    saveSession(data) {
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminData', JSON.stringify({
            username: data.username,
            id: data.id,
            role: data.role || 'admin'
        }));
    }

    handleLogout(e) {
        e.preventDefault();
        this.clearSession();
        this.redirectToLogin();
    }

    clearSession() {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
    }

    redirectToLogin() {
        window.location.href = '/admin/index.html';
    }

    redirectToDashboard() {
        window.location.href = '/admin/dashboard.html';
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new AuthController();
});