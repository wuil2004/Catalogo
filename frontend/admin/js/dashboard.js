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
    document.getElementById('userAvatar')?.addEventListener('click', toggleSidebar);
    document.getElementById('sidebarToggle')?.addEventListener('click', toggleSidebar);
    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });
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
        document.getElementById('thesisCarousel').innerHTML = `
            <div class="error-message">
                Error al cargar registros: ${error.message}
            </div>
        `;
    }
}

// Función para renderizar las tarjetas en el carrusel
function renderThesisCards(registros) {
    const carousel = document.getElementById('thesisCarousel');
    const dotsContainer = document.getElementById('carouselDots');
    carousel.innerHTML = '';
    dotsContainer.innerHTML = '';

    if (registros.length === 0) {
        carousel.innerHTML = '<p class="no-results">No hay registros de tesis disponibles</p>';
        return;
    }

    registros.forEach((registro, index) => {
        const card = document.createElement('div');
        card.className = 'bibliographic-card';
        const colorCode = getColorCode(registro.Color);
        card.style.border = `4px solid ${colorCode}`;

        const frontContent = registro.imagen 
            ? `<div class="card-image"><img src="${registro.imagen}" alt="Portada de tesis"></div>`
            : `<div class="card-title-front">${registro.Titulo}</div>`;

        card.innerHTML = `
            <div class="flip-card-inner">
                <div class="flip-card-front">
                    ${frontContent}
                </div>
                <div class="flip-card-back">
                    <h3 class="card-title">${registro.Titulo}</h3>
                    <div class="detail-item"><span class="detail-label">ID:</span> <span class="detail-value">${registro.N_de_Registro}</span></div>
                    <div class="detail-item"><span class="detail-label">N° Impreso/Digital:</span> <span class="detail-value">${registro.N_Impreso_Digital}</span></div>
                    <div class="detail-item"><span class="detail-label">Carrera:</span> <span class="detail-value">${registro.Carrera}</span></div>
                    <div class="detail-item"><span class="detail-label">Cuenta 1:</span> <span class="detail-value">${registro.N_Cuenta_1}</span></div>
                    ${registro.N_Cuenta_2 ? `<div class="detail-item"><span class="detail-label">Cuenta 2:</span> <span class="detail-value">${registro.N_Cuenta_2}</span></div>` : ''}
                    ${registro.N_Cuenta_3 ? `<div class="detail-item"><span class="detail-label">Cuenta 3:</span> <span class="detail-value">${registro.N_Cuenta_3}</span></div>` : ''}
                    <div class="detail-item"><span class="detail-label">Nombre 1:</span> <span class="detail-value">${registro.Nombre_1}</span></div>
                    ${registro.Nombre_2 ? `<div class="detail-item"><span class="detail-label">Nombre 2:</span> <span class="detail-value">${registro.Nombre_2}</span></div>` : ''}
                    ${registro.Nombre_3 ? `<div class="detail-item"><span class="detail-label">Nombre 3:</span> <span class="detail-value">${registro.Nombre_3}</span></div>` : ''}
                    <div class="detail-item"><span class="detail-label">Opción de titulación:</span> <span class="detail-value">${registro.Opcion_de_Titulacion}</span></div>
                    <div class="detail-item"><span class="detail-label">Fecha:</span> <span class="detail-value">${registro.Fecha_del_Trabajo}</span></div>
                    <div class="detail-item"><span class="detail-label">Color:</span> 
                        <span class="detail-value">
                            <span class="card-color" style="background: ${colorCode};"></span>
                            ${registro.Color}
                        </span>
                    </div>
                </div>
            </div>
        `;
        
        carousel.appendChild(card);

        const dot = document.createElement('div');
        dot.className = 'dot';
        dot.dataset.index = index;
        dot.addEventListener('click', () => scrollToCard(index));
        dotsContainer.appendChild(dot);
    });

    if (dotsContainer.firstChild) {
        dotsContainer.firstChild.classList.add('active');
    }

    setupCarouselControls(registros.length);
}

// Configurar controles del carrusel
function setupCarouselControls(totalCards) {
    const carousel = document.getElementById('thesisCarousel');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const dots = document.querySelectorAll('.dot');
    
    if (!carousel.firstChild) return;

    const card = document.querySelector('.bibliographic-card');
    const cardWidth = card.offsetWidth + 20;
    let currentIndex = 0;

    function updateCarousel() {
        carousel.scrollTo({
            left: currentIndex * cardWidth,
            behavior: 'smooth'
        });
        
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentIndex);
        });
    }

    prevBtn?.addEventListener('click', () => {
        currentIndex = Math.max(0, currentIndex - 1);
        updateCarousel();
    });

    nextBtn?.addEventListener('click', () => {
        currentIndex = Math.min(totalCards - 1, currentIndex + 1);
        updateCarousel();
    });

    // Configurar eventos táctiles
    let isDown = false;
    let startX;
    let scrollLeft;

    carousel.addEventListener('mousedown', (e) => {
        isDown = true;
        startX = e.pageX - carousel.offsetLeft;
        scrollLeft = carousel.scrollLeft;
    });

    carousel.addEventListener('mouseleave', () => {
        isDown = false;
    });

    carousel.addEventListener('mouseup', () => {
        isDown = false;
        currentIndex = Math.round(carousel.scrollLeft / cardWidth);
        updateCarousel();
    });

    carousel.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - carousel.offsetLeft;
        const walk = (x - startX) * 2;
        carousel.scrollLeft = scrollLeft - walk;
    });
}

function scrollToCard(index) {
    const carousel = document.getElementById('thesisCarousel');
    const card = document.querySelector('.bibliographic-card');
    if (!card) return;
    
    const cardWidth = card.offsetWidth + 20;
    carousel.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth'
    });

    document.querySelectorAll('.dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
}

// Función auxiliar para colores
function getColorCode(color) {
    const colorMap = {
        "NEGRO": "#000000",
        "AZUL": "#002147",
        "VERDE": "#014421",
        "GRIS OXFORD": "#2F4F4F",
        "CAFE": "#4B3621",
        "VINO": "#4B0014",
        "ROJO": "#8B0000",
        "GRIS": "#3A3A3A",
        "Default": "rgb(8, 114, 122)"
    };
    return colorMap[color] || colorMap.Default;
}

// Función para verificar el token
async function verifyToken(token) {
    try {
        const response = await fetch('http://localhost:3000/api/admins/verify-token', {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.valid === true;
        
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
        const token = localStorage.getItem('adminToken');
        if (!token) throw new Error('No autenticado');

        const tokenValid = await verifyToken(token);
        if (!tokenValid) throw new Error('Token inválido');

        setupSidebar();

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

        await loadThesisCards();// Alternar sidebar
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
    document.getElementById('userAvatar')?.addEventListener('click', toggleSidebar);
    document.getElementById('sidebarToggle')?.addEventListener('click', toggleSidebar);
    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });
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
        document.getElementById('thesisCarousel').innerHTML = `
            <div class="error-message">
                Error al cargar registros: ${error.message}
            </div>
        `;
    }
}

// Función para renderizar las tarjetas en el carrusel
function renderThesisCards(registros) {
    const carousel = document.getElementById('thesisCarousel');
    const dotsContainer = document.getElementById('carouselDots');
    carousel.innerHTML = '';
    dotsContainer.innerHTML = '';

    if (registros.length === 0) {
        carousel.innerHTML = '<p class="no-results">No hay registros de tesis disponibles</p>';
        return;
    }

    registros.forEach((registro, index) => {
        const card = document.createElement('div');
        card.className = 'bibliographic-card';
        const colorCode = getColorCode(registro.Color);
        card.style.border = `4px solid ${colorCode}`;

        const frontContent = registro.imagen 
            ? `<div class="card-image"><img src="${registro.imagen}" alt="Portada de tesis"></div>`
            : `<div class="card-title-front">${registro.Titulo}</div>`;

        card.innerHTML = `
            <div class="flip-card-inner">
                <div class="flip-card-front">
                    ${frontContent}
                </div>
                <div class="flip-card-back">
                    <h3 class="card-title">${registro.Titulo}</h3>
                    <div class="detail-item"><span class="detail-label">ID:</span> <span class="detail-value">${registro.N_de_Registro}</span></div>
                    <div class="detail-item"><span class="detail-label">N° Impreso/Digital:</span> <span class="detail-value">${registro.N_Impreso_Digital}</span></div>
                    <div class="detail-item"><span class="detail-label">Carrera:</span> <span class="detail-value">${registro.Carrera}</span></div>
                    <div class="detail-item"><span class="detail-label">Cuenta 1:</span> <span class="detail-value">${registro.N_Cuenta_1}</span></div>
                    ${registro.N_Cuenta_2 ? `<div class="detail-item"><span class="detail-label">Cuenta 2:</span> <span class="detail-value">${registro.N_Cuenta_2}</span></div>` : ''}
                    ${registro.N_Cuenta_3 ? `<div class="detail-item"><span class="detail-label">Cuenta 3:</span> <span class="detail-value">${registro.N_Cuenta_3}</span></div>` : ''}
                    <div class="detail-item"><span class="detail-label">Nombre 1:</span> <span class="detail-value">${registro.Nombre_1}</span></div>
                    ${registro.Nombre_2 ? `<div class="detail-item"><span class="detail-label">Nombre 2:</span> <span class="detail-value">${registro.Nombre_2}</span></div>` : ''}
                    ${registro.Nombre_3 ? `<div class="detail-item"><span class="detail-label">Nombre 3:</span> <span class="detail-value">${registro.Nombre_3}</span></div>` : ''}
                    <div class="detail-item"><span class="detail-label">Opción de titulación:</span> <span class="detail-value">${registro.Opcion_de_Titulacion}</span></div>
                    <div class="detail-item"><span class="detail-label">Fecha:</span> <span class="detail-value">${registro.Fecha_del_Trabajo}</span></div>
                    <div class="detail-item"><span class="detail-label">Color:</span> 
                        <span class="detail-value">
                            <span class="card-color" style="background: ${colorCode};"></span>
                            ${registro.Color}
                        </span>
                    </div>
                </div>
            </div>
        `;
        
        carousel.appendChild(card);

        const dot = document.createElement('div');
        dot.className = 'dot';
        dot.dataset.index = index;
        dot.addEventListener('click', () => scrollToCard(index));
        dotsContainer.appendChild(dot);
    });

    if (dotsContainer.firstChild) {
        dotsContainer.firstChild.classList.add('active');
    }

    setupCarouselControls(registros.length);
    centerActiveCard();
}

// Centrar tarjeta activa
function centerActiveCard() {
    const cards = document.querySelectorAll('.bibliographic-card');
    if (cards.length === 0) return;
    
    // Resetear todos los estilos primero
    cards.forEach(card => {
        card.style.transform = '';
        card.style.zIndex = '';
        card.style.boxShadow = '';
        card.style.opacity = '';
        card.style.filter = '';
    });
    
    // Encontrar la tarjeta central
    const centerIndex = Math.floor(cards.length / 2);
    
    // Aplicar estilos a la tarjeta central
    if (cards[centerIndex]) {
        cards[centerIndex].style.transform = 'scale(1.1) translateY(-20px)';
        cards[centerIndex].style.zIndex = '2';
        cards[centerIndex].style.boxShadow = '0 15px 30px rgba(0,0,0,0.2)';
    }
    
    // Aplicar estilos a las tarjetas adyacentes
    if (centerIndex > 0 && cards[centerIndex - 1]) {
        cards[centerIndex - 1].style.transform = 'scale(0.9) translateY(10px)';
        cards[centerIndex - 1].style.opacity = '0.9';
        cards[centerIndex - 1].style.filter = 'brightness(0.95)';
    }
    
    if (centerIndex < cards.length - 1 && cards[centerIndex + 1]) {
        cards[centerIndex + 1].style.transform = 'scale(0.9) translateY(10px)';
        cards[centerIndex + 1].style.opacity = '0.9';
        cards[centerIndex + 1].style.filter = 'brightness(0.95)';
    }
}

// Configurar controles del carrusel
function setupCarouselControls(totalCards) {
    const carousel = document.getElementById('thesisCarousel');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const dots = document.querySelectorAll('.dot');
    
    if (!carousel.firstChild) return;

    const card = document.querySelector('.bibliographic-card');
    const cardWidth = card.offsetWidth + 20;
    let currentIndex = 0;

    function updateCarousel() {
        carousel.scrollTo({
            left: currentIndex * cardWidth,
            behavior: 'smooth'
        });
        
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentIndex);
        });
        
        centerActiveCard();
    }

    prevBtn?.addEventListener('click', () => {
        currentIndex = Math.max(0, currentIndex - 1);
        updateCarousel();
    });

    nextBtn?.addEventListener('click', () => {
        currentIndex = Math.min(totalCards - 1, currentIndex + 1);
        updateCarousel();
    });

    // Configurar eventos táctiles
    let isDown = false;
    let startX;
    let scrollLeft;

    carousel.addEventListener('mousedown', (e) => {
        isDown = true;
        startX = e.pageX - carousel.offsetLeft;
        scrollLeft = carousel.scrollLeft;
    });

    carousel.addEventListener('mouseleave', () => {
        isDown = false;
    });

    carousel.addEventListener('mouseup', () => {
        isDown = false;
        currentIndex = Math.round(carousel.scrollLeft / cardWidth);
        updateCarousel();
    });

    carousel.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - carousel.offsetLeft;
        const walk = (x - startX) * 2;
        carousel.scrollLeft = scrollLeft - walk;
    });

    // Actualizar al desplazar
    carousel.addEventListener('scroll', () => {
        clearTimeout(carousel.scrollTimeout);
        carousel.scrollTimeout = setTimeout(() => {
            currentIndex = Math.round(carousel.scrollLeft / cardWidth);
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === currentIndex);
            });
            centerActiveCard();
        }, 100);
    });
}

function scrollToCard(index) {
    const carousel = document.getElementById('thesisCarousel');
    const card = document.querySelector('.bibliographic-card');
    if (!card) return;
    
    const cardWidth = card.offsetWidth + 20;
    carousel.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth'
    });

    document.querySelectorAll('.dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
}

// Función auxiliar para colores
function getColorCode(color) {
    const colorMap = {
        "NEGRO": "#000000",
        "AZUL": "#002147",
        "VERDE": "#014421",
        "GRIS OXFORD": "#2F4F4F",
        "CAFE": "#4B3621",
        "VINO": "#4B0014",
        "ROJO": "#8B0000",
        "GRIS": "#3A3A3A",
        "Default": "rgb(8, 114, 122)"
    };
    return colorMap[color] || colorMap.Default;
}

// Función para verificar el token
async function verifyToken(token) {
    try {
        const response = await fetch('http://localhost:3000/api/admins/verify-token', {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.valid === true;
        
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
        const token = localStorage.getItem('adminToken');
        if (!token) throw new Error('No autenticado');

        const tokenValid = await verifyToken(token);
        if (!tokenValid) throw new Error('Token inválido');

        setupSidebar();

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

        await loadThesisCards();

    } catch (error) {
        console.error('Error de autenticación:', error);
        logout();
    }
});

window.addEventListener('resize', setupResponsive);

    } catch (error) {
        console.error('Error de autenticación:', error);
        logout();
    }
});

window.addEventListener('resize', setupResponsive);