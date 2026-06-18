require('dotenv').config(); // <--- 1. CARGAR VARIABLES DE ENTORNO

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const multer = require('multer'); 

// <--- 2. IMPORTAR CLOUDINARY --->
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const conexion = require('./conexion');
const { authenticateToken } = require('./middleware/authMiddleware');
const adminController = require('./controllers/adminController');
const registrosController = require('./controllers/registrosController');

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // Necesario para procesar form-data

// <--- 3. CONFIGURACIÓN DE CLOUDINARY Y MULTER --->
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'tesis_tesji', // Así se llamará la carpeta en tu nube
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'gif']
  },
});
const upload = multer({ storage: storage });

// ---- RUTAS DE ARCHIVOS ESTÁTICOS ----
app.use(express.static(path.join(__dirname, '../frontend/public')));
app.use('/admin', express.static(path.join(__dirname, '../frontend/admin')));
// Mantenemos esta ruta por si tienes imágenes locales viejas que aún necesiten cargar
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ruta principal para servir el index.html público
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

// Redirecciones bien definidas
app.get(['/admin', '/admin/'], (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/admin/index.html'));
});

// Agrega esta nueva ruta para verificar tokens
app.get('/api/admins/verify-token', authenticateToken, (req, res) => {
    res.json({ valid: true });
});

// API pública
app.get('/api/registros', (req, res) => {
    conexion.query('SELECT * FROM Registros', (err, resultados) => {
        if (err) {
            console.error('Error al obtener registros:', err);
            return res.status(500).json({ error: 'Error al obtener registros' });
        }
        res.json(resultados);
    });
});

// API para administradores
app.post('/api/admins/register', adminController.registerAdmin);
app.post('/api/admins/login', adminController.loginAdmin);
app.get('/api/admins', authenticateToken, adminController.getAllAdmins);
app.get('/api/admins/:id', authenticateToken, adminController.getAdminById);
app.put('/api/admins/:id', authenticateToken, adminController.updateAdmin);
app.delete('/api/admins/:id', authenticateToken, adminController.deleteAdmin);

// Ruta para dashboard
app.get('/api/admins/dashboard', authenticateToken, (req, res) => {
    res.json({ 
        message: 'Datos del dashboard',
        stats: {
            users: 125,
            registros: 42,
            lastActivity: '2025-08-17' 
        }
    });
});

// ---- API PARA REGISTROS (PROTEGIDA Y MODIFICADA) ----
app.get('/api/registros/admin', authenticateToken, registrosController.getAllRegistros);
app.get('/api/registros/admin/:id', authenticateToken, registrosController.getRegistroById);
app.delete('/api/registros/admin/:id', authenticateToken, registrosController.deleteRegistro);

// AÑADIR EL MIDDLEWARE DE MULTER A LAS RUTAS POST Y PUT
app.post('/api/registros/admin', authenticateToken, upload.single('imagen'), registrosController.createRegistro);
app.put('/api/registros/admin/:id', authenticateToken, upload.single('imagen'), registrosController.updateRegistro);

// Manejo de errores
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

app.listen(port, () => {
    console.log(`Servidor ejecutándose en http://localhost:${port}`);
});