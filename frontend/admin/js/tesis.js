// Variables globales
let currentPage = 1;
let itemsPerPage = 10;
let totalItems = 0;
let originalData = [];  // Datos originales (nunca se modifican)
let filteredData = [];  // Datos filtrados (copia para trabajar)
let currentData = [];   // Datos de la página actual
let currentView = 'table'; // 'table' o 'cards'

// Inicialización al cargar el DOM
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticación
    await verifyAuth();

    // Configurar eventos
    setupEventListeners();

    // Cargar los registros
    await loadRegistros();

    // Configurar modales
    setupModals();

    // Configurar responsividad
    setupResponsive();
});

// Verificar autenticación
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

    // Filtros
    document.getElementById('searchBtn').addEventListener('click', applyFilters);
    document.getElementById('searchInput').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') applyFilters();
    });

    document.getElementById('carreraFilter').addEventListener('change', applyFilters);
    document.getElementById('fechaFilter').addEventListener('change', applyFilters);

    document.getElementById('resetFilters').addEventListener('click', resetFilters);

    // Cambio de vista
    document.getElementById('tableViewBtn').addEventListener('click', () => {
        currentView = 'table';
        document.getElementById('tableViewBtn').classList.add('active');
        document.getElementById('cardViewBtn').classList.remove('active');
        document.querySelector('.table-responsive').style.display = 'block';
        document.getElementById('cardsViewContainer').style.display = 'none';
    });

    document.getElementById('cardViewBtn').addEventListener('click', () => {
        currentView = 'cards';
        document.getElementById('cardViewBtn').classList.add('active');
        document.getElementById('tableViewBtn').classList.remove('active');
        document.querySelector('.table-responsive').style.display = 'none';
        document.getElementById('cardsViewContainer').style.display = 'grid';
        displayCards(currentData);
    });

    // Cerrar sesión
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/index.html';
    });

    // Nuevo registro
    document.getElementById('newWorkBtn').addEventListener('click', () => showRegistroModal('create'));
}

// Resetear filtros
function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('carreraFilter').value = '';
    document.getElementById('fechaFilter').value = '';
    
    // Restaurar datos originales
    filteredData = [...originalData];
    totalItems = filteredData.length;
    currentPage = 1;
    
    updatePagination();
    displayPage(currentPage);
}

// Configurar modales
function setupModals() {
    const modals = document.querySelectorAll('.modal');
    
    modals.forEach(modal => {
        const closeBtn = modal.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.onclick = () => modal.style.display = 'none';
        }
    });

    // Configurar el formulario
    setupRegistroForm();

    // Cerrar modales al hacer clic fuera
    window.onclick = (event) => {
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    };

    // Cerrar modales con ESC
    window.onkeydown = (event) => {
        if (event.key === 'Escape') {
            modals.forEach(modal => {
                modal.style.display = 'none';
            });
        }
    };
}

// Configurar responsividad
function setupResponsive() {
    window.addEventListener('resize', setupResponsiveTable);
    setupResponsiveTable();
}

function setupResponsiveTable() {
    const table = document.querySelector('.registros-table');
    if (!table) return;

    const headers = table.querySelectorAll('th');
    const rows = table.querySelectorAll('tbody tr');

    // Determinar qué columnas mostrar según el ancho de pantalla
    if (window.innerWidth < 768) {
        headers.forEach((header, index) => {
            if (header.classList.contains('priority-1')) {
                header.style.display = 'table-cell';
            } else {
                header.style.display = 'none';
            }
        });

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            cells.forEach((cell, index) => {
                if (cell.classList.contains('priority-1')) {
                    cell.style.display = 'table-cell';
                } else {
                    cell.style.display = 'none';
                }
            });
        });
    } else {
        headers.forEach(header => header.style.display = 'table-cell');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            cells.forEach(cell => cell.style.display = 'table-cell');
        });
    }
}

// Cargar registros desde la API
async function loadRegistros() {
    try {
        showLoading();

        const token = localStorage.getItem('adminToken');
        const response = await fetch('http://localhost:3000/api/registros/admin', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Error al cargar datos');

        originalData = await response.json();
        filteredData = [...originalData];
        totalItems = filteredData.length;
        
        // Llenar filtros
        fillFilters();
        
        updatePagination();
        displayPage(currentPage);

    } catch (error) {
        console.error('Error cargando registros:', error);
        alert('Error al cargar los registros');
    } finally {
        hideLoading();
    }
}

// Llenar filtros con datos disponibles
function fillFilters() {
    const carreraFilter = document.getElementById('carreraFilter');
    const fechaFilter = document.getElementById('fechaFilter');
    
    // Limpiar opciones existentes (excepto la primera)
    while (carreraFilter.options.length > 1) carreraFilter.remove(1);
    while (fechaFilter.options.length > 1) fechaFilter.remove(1);
    
    // Obtener valores únicos
    const carreras = [...new Set(originalData.map(item => item.Carrera))].filter(Boolean);
    const fechas = [...new Set(originalData.map(item => {
        if (item.Fecha_del_Trabajo) {
            const parts = item.Fecha_del_Trabajo.split(' ');
            return parts[parts.length - 1]; // Obtener el año
        }
        return null;
    }))].filter(Boolean).sort((a, b) => b - a); // Ordenar de más reciente a más antiguo
    
    // Llenar filtro de carreras
    carreras.forEach(carrera => {
        const option = document.createElement('option');
        option.value = carrera;
        option.textContent = carrera;
        carreraFilter.appendChild(option);
    });
    
    // Llenar filtro de fechas
    fechas.forEach(fecha => {
        const option = document.createElement('option');
        option.value = fecha;
        option.textContent = fecha;
        fechaFilter.appendChild(option);
    });
}

// Aplicar filtros
function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const carrera = document.getElementById('carreraFilter').value;
    const fecha = document.getElementById('fechaFilter').value;

    // Siempre empezar con los datos originales
    filteredData = [...originalData];

    // Aplicar filtros sobre la copia
    if (searchTerm) {
        filteredData = filteredData.filter(item =>
            (item.Titulo && item.Titulo.toLowerCase().includes(searchTerm)) ||
            (item.Nombre_1 && item.Nombre_1.toLowerCase().includes(searchTerm)) ||
            (item.Nombre_2 && item.Nombre_2.toLowerCase().includes(searchTerm)) ||
            (item.Nombre_3 && item.Nombre_3.toLowerCase().includes(searchTerm))
        );
    }

    if (carrera) {
        filteredData = filteredData.filter(item => item.Carrera === carrera);
    }

    if (fecha) {
        filteredData = filteredData.filter(item =>
            item.Fecha_del_Trabajo && item.Fecha_del_Trabajo.includes(fecha)
        );
    }

    // Actualizar con los datos filtrados
    totalItems = filteredData.length;
    currentPage = 1;
    updatePagination();
    displayPage(currentPage);
}

// Mostrar página específica
function displayPage(page) {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    currentData = filteredData.slice(start, end);

    // Actualizar la vista según el modo actual
    if (currentView === 'table') {
        displayTable(currentData);
    } else {
        displayCards(currentData);
    }

    // Actualizar información de paginación
    document.getElementById('startItem').textContent = start + 1;
    document.getElementById('endItem').textContent = Math.min(end, totalItems);
    document.getElementById('totalItems').textContent = totalItems;

    // Actualizar estado de botones
    document.getElementById('firstPage').disabled = page === 1;
    document.getElementById('prevPage').disabled = page === 1;
    document.getElementById('nextPage').disabled = end >= totalItems;
    document.getElementById('lastPage').disabled = end >= totalItems;

    // Actualizar números de página
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

// Mostrar datos en tabla
function displayTable(data) {
    const tbody = document.getElementById('registros-body');
    tbody.innerHTML = '';

    if (data.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="15" style="text-align: center;">No se encontraron registros</td>`;
        tbody.appendChild(row);
        return;
    }

    data.forEach(registro => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${registro.N_de_Registro || 'N/A'}</td>
            <td>${registro.N_Impreso_Digital || 'N/A'}</td>
            <td>${registro.Carrera || 'N/A'}</td>
            
            <!-- Estudiante 1 -->
            <td class="expandable" 
                data-tooltip="${registro.Nombre_1 || ''}"
                onclick="${registro.Nombre_1 ? `showFullText('Estudiante 1', '${escapeHtml(registro.Nombre_1)}')` : ''}">
                <span class="student-name">${registro.Nombre_1 || 'N/A'}</span>
            </td>
            <td>
                <span class="student-account">${registro.N_Cuenta_1 || 'N/A'}</span>
            </td>
            
            <!-- Estudiante 2 -->
            <td class="expandable" 
                data-tooltip="${registro.Nombre_2 || ''}"
                onclick="${registro.Nombre_2 ? `showFullText('Estudiante 2', '${escapeHtml(registro.Nombre_2)}')` : ''}">
                <span class="student-name">${registro.Nombre_2 || 'N/A'}</span>
            </td>
            <td>
                <span class="student-account">${registro.N_Cuenta_2 || 'N/A'}</span>
            </td>
            
            <!-- Estudiante 3 -->
            <td class="expandable" 
                data-tooltip="${registro.Nombre_3 || ''}"
                onclick="${registro.Nombre_3 ? `showFullText('Estudiante 3', '${escapeHtml(registro.Nombre_3)}')` : ''}">
                <span class="student-name">${registro.Nombre_3 || 'N/A'}</span>
            </td>
            <td>
                <span class="student-account">${registro.N_Cuenta_3 || 'N/A'}</span>
            </td>
            
            <td>${registro.Opcion_de_Titulacion || 'N/A'}</td>
            <td class="expandable" 
                data-tooltip="${registro.Titulo || ''}"
                onclick="showFullText('Título del Trabajo', '${escapeHtml(registro.Titulo || 'N/A')}')">
                <div class="text-ellipsis">${registro.Titulo || 'N/A'}</div>
            </td>
            <td>${registro.Fecha_del_Trabajo || 'N/A'}</td>
            <td>${registro.Color || 'N/A'}</td>
            <td>${formatImage(registro.imagen)}</td>
            <td class="column-actions">
                <button class="btn-edit" onclick="editRegistro(${registro.N_de_Registro})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        `;

        tbody.appendChild(row);
    });

    // Reconfigurar la responsividad después de actualizar la tabla
    setupResponsiveTable();
}

// Mostrar datos en tarjetas
function displayCards(data) {
    const container = document.getElementById('cardsViewContainer');
    container.innerHTML = '';

    if (data.length === 0) {
        container.innerHTML = '<div class="no-results">No se encontraron resultados</div>';
        return;
    }

    data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        
        card.innerHTML = `
            <div class="card-edit-btn" onclick="event.stopPropagation(); editRegistro(${item.N_de_Registro})" title="Editar">
                <i class="fas fa-edit"></i>
            </div>
            
            ${item.imagen ? `<img src="${item.imagen}" class="card-image" alt="Trabajo">` : 
              '<div class="card-no-image"><i class="fas fa-image"></i></div>'}
            
            <div class="card-header">
                <h3 class="card-title">${item.Titulo || 'Sin título'}</h3>
            </div>
            
            <div class="card-body">
                <div class="card-field">
                    <span class="card-label">Código</span>
                    <span class="card-value">${item.N_Impreso_Digital || 'N/A'}</span>
                </div>
                <div class="card-field">
                    <span class="card-label">Carrera</span>
                    <span class="card-value">${item.Carrera || 'N/A'}</span>
                </div>
                <div class="card-field">
                    <span class="card-label">Opción</span>
                    <span class="card-value">${item.Opcion_de_Titulacion || 'N/A'}</span>
                </div>
                
                <div class="card-students">
                    ${item.Nombre_1 ? `
                    <div class="card-student">
                        <span>${item.Nombre_1}</span>
                        <span class="student-account">${item.N_Cuenta_1 || ''}</span>
                    </div>` : ''}
                    
                    ${item.Nombre_2 ? `
                    <div class="card-student">
                        <span>${item.Nombre_2}</span>
                        <span class="student-account">${item.N_Cuenta_2 || ''}</span>
                    </div>` : ''}
                    
                    ${item.Nombre_3 ? `
                    <div class="card-student">
                        <span>${item.Nombre_3}</span>
                        <span class="student-account">${item.N_Cuenta_3 || ''}</span>
                    </div>` : ''}
                </div>
            </div>
            
            <div class="card-footer">
                <span class="card-date">${item.Fecha_del_Trabajo || 'Sin fecha'}</span>
                <span class="card-color" style="background: ${getColorCode(item.Color)}"></span>
            </div>
        `;

        card.addEventListener('click', () => showCardDetails(item));
        container.appendChild(card);
    });
}

// Función para mostrar detalles de la tarjeta
function showCardDetails(item) {
    const modal = document.getElementById('cardDetailsModal');
    const title = document.getElementById('cardDetailsTitle');
    const imageContainer = document.getElementById('cardDetailsImage');
    const registro = document.getElementById('cardDetailsRegistro');
    const code = document.getElementById('cardDetailsCode');
    const career = document.getElementById('cardDetailsCareer');
    const option = document.getElementById('cardDetailsOption');
    const date = document.getElementById('cardDetailsDate');
    const color = document.getElementById('cardDetailsColor');
    const studentsContainer = document.getElementById('cardDetailsStudents');
    const accountsContainer = document.getElementById('cardDetailsAccounts');

    // Establecer los valores
    title.textContent = item.Titulo || 'Sin título';

    // Imagen
    imageContainer.innerHTML = item.imagen
        ? `<img src="${item.imagen}" alt="Imagen del trabajo">`
        : '<span class="no-image">Sin imagen</span>';

    // Detalles principales
    registro.textContent = item.N_de_Registro || 'N/A';
    code.textContent = item.N_Impreso_Digital || 'N/A';
    career.textContent = item.Carrera || 'N/A';
    option.textContent = item.Opcion_de_Titulacion || 'N/A';
    date.textContent = item.Fecha_del_Trabajo || 'N/A';
    color.innerHTML = item.Color
        ? `${item.Color} <span style="background: ${getColorCode(item.Color)}; width: 15px; height: 15px; border-radius: 50%; display: inline-block; vertical-align: middle; margin-left: 5px;"></span>`
        : 'N/A';

    // Estudiantes
    studentsContainer.innerHTML = '';
    if (item.Nombre_1) {
        const studentDiv = document.createElement('div');
        studentDiv.className = 'details-student';
        studentDiv.textContent = item.Nombre_1;
        studentsContainer.appendChild(studentDiv);
    }
    if (item.Nombre_2) {
        const studentDiv = document.createElement('div');
        studentDiv.className = 'details-student';
        studentDiv.textContent = item.Nombre_2;
        studentsContainer.appendChild(studentDiv);
    }
    if (item.Nombre_3) {
        const studentDiv = document.createElement('div');
        studentDiv.className = 'details-student';
        studentDiv.textContent = item.Nombre_3;
        studentsContainer.appendChild(studentDiv);
    }
    if (studentsContainer.children.length === 0) {
        studentsContainer.innerHTML = '<div class="no-data">No hay estudiantes registrados</div>';
    }

    // Cuentas
    accountsContainer.innerHTML = '';
    if (item.N_Cuenta_1) {
        const accountDiv = document.createElement('div');
        accountDiv.className = 'details-account';
        accountDiv.textContent = item.N_Cuenta_1;
        accountsContainer.appendChild(accountDiv);
    }
    if (item.N_Cuenta_2) {
        const accountDiv = document.createElement('div');
        accountDiv.className = 'details-account';
        accountDiv.textContent = item.N_Cuenta_2;
        accountsContainer.appendChild(accountDiv);
    }
    if (item.N_Cuenta_3) {
        const accountDiv = document.createElement('div');
        accountDiv.className = 'details-account';
        accountDiv.textContent = item.N_Cuenta_3;
        accountsContainer.appendChild(accountDiv);
    }
    if (accountsContainer.children.length === 0) {
        accountsContainer.innerHTML = '<div class="no-data">No hay cuentas registradas</div>';
    }

    // Mostrar modal
    modal.style.display = 'block';
}

// Formatear imagen para tabla
function formatImage(imageUrl) {
    if (!imageUrl) return '<span class="no-image">Sin imagen</span>';

    return `
        <div style="cursor: pointer;" onclick="showFullImage('${imageUrl}')">
            <img src="${imageUrl}" alt="Miniatura" style="max-width: 100px; max-height: 60px;">
            <div style="font-size: 11px; color: #666; text-align: center;">Ver imagen</div>
        </div>
    `;
}

// Obtener código de color
function getColorCode(colorName) {
    const colors = {
        'rojo': '#ff0000',
        'azul': '#0000ff',
        'verde': '#00ff00',
        'amarillo': '#ffff00',
        'negro': '#000000',
        'blanco': '#ffffff',
        'gris oxford': '#808080',
        'cafe': '#964B00',
        'vino': '#722F37',
        'gris': '#808080'
    };
    return colors[colorName?.toLowerCase()] || '#cccccc';
}

// Escapar HTML
function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .replace(/\n/g, "<br>");
}

// Mostrar loading
function showLoading() {
    document.querySelector('.loading-overlay').style.display = 'flex';
}

function hideLoading() {
    document.querySelector('.loading-overlay').style.display = 'none';
}

// Funciones globales
window.showFullText = function (title, content) {
    const modal = document.getElementById('textModal');
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalText').innerHTML = content;
    modal.style.display = 'block';
};

window.showFullImage = function (imageUrl) {
    const modal = document.getElementById('imageModal');
    const container = document.getElementById('modalImageContainer');
    const link = document.getElementById('imageDownloadLink');

    container.innerHTML = `<img src="${imageUrl}" style="max-width: 100%; max-height: 70vh;">`;
    link.href = imageUrl;

    modal.style.display = 'block';
};

// Mostrar modal para nuevo/editar registro
function showRegistroModal(mode = 'create', registroData = null) {
    const modal = document.getElementById('registroModal');
    const form = document.getElementById('registroForm');
    const title = document.getElementById('modalRegistroTitle');
    const submitBtn = document.getElementById('submitBtn');
    
    // Resetear el formulario
    form.reset();
    
    if (mode === 'create') {
        title.innerHTML = '<i class="fas fa-plus"></i> Nuevo Trabajo de Titulación';
        submitBtn.textContent = 'Guardar Trabajo';
        document.getElementById('registroId').value = '';
        
        // Configurar fecha actual por defecto
        const today = new Date();
        document.getElementById('anioTrabajo').value = today.getFullYear();
    } else if (mode === 'edit' && registroData) {
        title.innerHTML = '<i class="fas fa-edit"></i> Editar Trabajo de Titulación';
        submitBtn.textContent = 'Actualizar Trabajo';
        
        // Llenar el formulario con los datos del registro
        populateForm(registroData);
    }
    
    modal.style.display = 'block';
}

// Función para llenar el formulario con datos
function populateForm(data) {
    console.log('Datos recibidos para formulario:', data);
    
    // Campos básicos
    document.getElementById('registroId').value = data.N_de_Registro || '';
    document.getElementById('nImpresoDigital').value = data.N_Impreso_Digital || '';
    document.getElementById('titulo').value = data.Titulo || '';
    document.getElementById('imagen').value = data.imagen || '';
    
    // Carrera
    if (data.Carrera) {
        const carreraSelect = document.getElementById('carrera');
        for (let i = 0; i < carreraSelect.options.length; i++) {
            if (carreraSelect.options[i].value === data.Carrera) {
                carreraSelect.selectedIndex = i;
                break;
            }
        }
    }
    
    // Opción de titulación
    if (data.Opcion_de_Titulacion) {
        const opcionSelect = document.getElementById('opcionTitulacion');
        for (let i = 0; i < opcionSelect.options.length; i++) {
            if (opcionSelect.options[i].value === data.Opcion_de_Titulacion) {
                opcionSelect.selectedIndex = i;
                break;
            }
        }
    }
    
    // Color
    if (data.Color) {
        const colorSelect = document.getElementById('color');
        for (let i = 0; i < colorSelect.options.length; i++) {
            if (colorSelect.options[i].value === data.Color) {
                colorSelect.selectedIndex = i;
                break;
            }
        }
    }
    
    // Procesar fecha (formato: "MES DE AÑO")
    if (data.Fecha_del_Trabajo) {
        const [mesTexto, , anio] = data.Fecha_del_Trabajo.split(' ');
        const meses = {
            'ENERO': '01', 'FEBRERO': '02', 'MARZO': '03', 'ABRIL': '04',
            'MAYO': '05', 'JUNIO': '06', 'JULIO': '07', 'AGOSTO': '08',
            'SEPTIEMBRE': '09', 'OCTUBRE': '10', 'NOVIEMBRE': '11', 'DICIEMBRE': '12'
        };
        
        // Mes
        if (mesTexto && meses[mesTexto]) {
            const mesSelect = document.getElementById('mesTrabajo');
            mesSelect.value = meses[mesTexto];
        }
        
        // Año
        if (anio) {
            document.getElementById('anioTrabajo').value = anio;
        }
    }
    
    // Estudiantes
    document.getElementById('nombre1').value = data.Nombre_1 || '';
    document.getElementById('cuenta1').value = data.N_Cuenta_1 || '';
    document.getElementById('nombre2').value = data.Nombre_2 || '';
    document.getElementById('cuenta2').value = data.N_Cuenta_2 || '';
    document.getElementById('nombre3').value = data.Nombre_3 || '';
    document.getElementById('cuenta3').value = data.N_Cuenta_3 || '';
}

// Función para cerrar el modal
function closeRegistroModal() {
    document.getElementById('registroModal').style.display = 'none';
}

// Función para editar un registro
async function editRegistro(registroId) {
    try {
        showLoading();
        
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`http://localhost:3000/api/registros/admin/${registroId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error(`Error al cargar registro: ${response.status} ${response.statusText}`);
        }
        
        const registroData = await response.json();
        showRegistroModal('edit', registroData);
        
    } catch (error) {
        console.error('Error al editar registro:', error);
        alert(`Error al cargar el registro para editar: ${error.message}`);
    } finally {
        hideLoading();
    }
}

// Configurar el formulario de registro
function setupRegistroForm() {
    const form = document.getElementById('registroForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Obtener mes y año
        const mes = document.getElementById('mesTrabajo').value;
        const anio = document.getElementById('anioTrabajo').value;

        // Validar
        if (!mes || !anio) {
            alert('Seleccione mes y año válidos');
            return;
        }

        // Mapear mes a texto (EJ: "07" -> "JULIO")
        const meses = {
            '01': 'ENERO', '02': 'FEBRERO', '03': 'MARZO', '04': 'ABRIL',
            '05': 'MAYO', '06': 'JUNIO', '07': 'JULIO', '08': 'AGOSTO',
            '09': 'SEPTIEMBRE', '10': 'OCTUBRE', '11': 'NOVIEMBRE', '12': 'DICIEMBRE'
        };

        // Formatear fecha como "JULIO DE 2025"
        const fechaTexto = `${meses[mes]} DE ${anio}`;
        document.getElementById('fechaTrabajo').value = fechaTexto;

        // Crear objeto con los datos del formulario
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        const registroId = document.getElementById('registroId').value;

        try {
            showLoading();
            const token = localStorage.getItem('adminToken');
            
            let response;
            if (registroId) {
                // Actualizar registro existente
                response = await fetch(`http://localhost:3000/api/registros/admin/${registroId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(data)
                });
            } else {
                // Crear nuevo registro
                response = await fetch('http://localhost:3000/api/registros/admin', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(data)
                });
            }

            if (!response.ok) throw new Error(registroId ? 'Error al actualizar registro' : 'Error al crear registro');
            
            closeRegistroModal();
            await loadRegistros();
            
            alert(registroId ? 'Registro actualizado correctamente' : 'Registro creado correctamente');

        } catch (error) {
            console.error(error.message);
            alert(error.message);
        } finally {
            hideLoading();
        }
    });
}

// Actualizar paginación
function updatePagination() {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const pagination = document.querySelector('.pagination');
    
    // Actualizar estado de botones
    document.getElementById('firstPage').disabled = currentPage === 1;
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages || totalPages === 0;
    document.getElementById('lastPage').disabled = currentPage === totalPages || totalPages === 0;
    
    // Actualizar números de página
    updatePageNumbers(currentPage);
}