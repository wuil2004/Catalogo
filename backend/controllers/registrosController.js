const conexion = require('../conexion');
const fs = require('fs');
const path = require('path');

const getAllRegistros = (req, res) => {
    const query = 'SELECT * FROM Registros';
    conexion.query(query, (err, resultados) => {
        if (err) {
            console.error('Error al obtener registros:', err);
            return res.status(500).json({ error: 'Error al obtener registros' });
        }
        res.json(resultados);
    });
};

const getRegistroById = (req, res) => {
    const id = req.params.id;
    const query = 'SELECT * FROM Registros WHERE N_de_Registro = ?';
    conexion.query(query, [id], (err, resultados) => {
        if (err) {
            console.error('Error al obtener registro:', err);
            return res.status(500).json({ error: 'Error al obtener registro' });
        }
        if (resultados.length === 0) {
            return res.status(404).json({ error: 'Registro no encontrado' });
        }
        res.json(resultados[0]);
    });
};

const createRegistro = (req, res) => {
    // Si multer procesó un archivo, su información estará en req.file
    if (req.file) {
        // Creamos la ruta de acceso web y la añadimos al cuerpo de la petición
        req.body.imagen = `/uploads/${req.file.filename}`;
    }

    // El resto del código funciona igual, ya que req.body ahora tiene el campo 'imagen'
    const {
        N_Impreso_Digital,
        Carrera,
        N_Cuenta_1,
        N_Cuenta_2,
        N_Cuenta_3,
        Nombre_1,
        Nombre_2,
        Nombre_3,
        Opcion_de_Titulacion,
        Titulo,
        Fecha_del_Trabajo,
        Color,
        imagen
    } = req.body;

    const query = `
        INSERT INTO Registros (
            N_Impreso_Digital, Carrera, N_Cuenta_1, N_Cuenta_2, N_Cuenta_3, Nombre_1, Nombre_2, Nombre_3, Opcion_de_Titulacion, Titulo, Fecha_del_Trabajo, Color, imagen
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        N_Impreso_Digital, Carrera, N_Cuenta_1, N_Cuenta_2, N_Cuenta_3, Nombre_1, Nombre_2, Nombre_3, Opcion_de_Titulacion, Titulo, Fecha_del_Trabajo, Color, imagen
    ];

    conexion.query(query, values, (err, result) => {
        if (err) {
            console.error('Error al crear registro:', err);
            return res.status(500).json({ error: 'Error al crear registro' });
        }
        res.status(201).json({ 
            message: 'Registro creado exitosamente',
            id: result.insertId 
        });
    });
};

// --- 2. FUNCIÓN updateRegistro COMPLETAMENTE ACTUALIZADA ---
const updateRegistro = (req, res) => {
    const id = req.params.id;
    const newData = req.body;

    // Primero, obtenemos la ruta de la imagen actual desde la base de datos
    conexion.query('SELECT imagen FROM Registros WHERE N_de_Registro = ?', [id], (err, results) => {
        if (err) {
            console.error('Error al obtener registro para actualizar:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Registro no encontrado' });
        }

        const oldImagePath = results[0].imagen;
        let finalImagePath = oldImagePath; // Por defecto, mantenemos la imagen antigua

        // CASO 1: Se sube un archivo nuevo (reemplazar)
        if (req.file) {
            finalImagePath = `/uploads/${req.file.filename}`;
            // Si había una imagen antigua, la borramos del servidor
            if (oldImagePath) {
                const fullPath = path.join(__dirname, '..', oldImagePath); // Ej: backend/uploads/imagen.jpg
                fs.unlink(fullPath, (unlinkErr) => {
                    if (unlinkErr) console.error("Error al borrar el archivo antiguo:", unlinkErr);
                });
            }
        } 
        // CASO 2: Se marcó la bandera para eliminar la imagen
        else if (newData.deleteImage === '1') {
            finalImagePath = null; // La nueva ruta en la BD será NULL
            // Si había una imagen, la borramos del servidor
            if (oldImagePath) {
                const fullPath = path.join(__dirname, '..', oldImagePath);
                fs.unlink(fullPath, (unlinkErr) => {
                    if (unlinkErr) console.error("Error al borrar el archivo:", unlinkErr);
                });
            }
        }

        // Preparamos los datos finales para la actualización
        newData.imagen = finalImagePath;
        delete newData.deleteImage; // Borramos la bandera, no es una columna de la BD

        // Procedemos a actualizar la base de datos
        const query = 'UPDATE Registros SET ? WHERE N_de_Registro = ?';
        conexion.query(query, [newData, id], (updateErr, updateResult) => {
            if (updateErr) {
                console.error('Error al actualizar registro:', updateErr);
                return res.status(500).json({ error: 'Error al actualizar registro' });
            }
            res.json({ message: 'Registro actualizado exitosamente' });
        });
    });
};

const deleteRegistro = (req, res) => {
    const id = req.params.id;
    const query = 'DELETE FROM Registros WHERE N_de_Registro = ?';
    
    conexion.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error al eliminar registro:', err);
            return res.status(500).json({ error: 'Error al eliminar registro' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Registro no encontrado' });
        }
        res.json({ message: 'Registro eliminado exitosamente' });
    });
};

module.exports = {
    getAllRegistros,
    getRegistroById,
    createRegistro,
    updateRegistro,
    deleteRegistro
};