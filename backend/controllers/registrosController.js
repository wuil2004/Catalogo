const conexion = require('../conexion');
const cloudinary = require('cloudinary').v2; // <--- 1. Importamos cloudinary

// --- FUNCIÓN HELPER PARA BORRAR EN CLOUDINARY ---
const borrarImagenCloudinary = async (imageUrl) => {
    if (imageUrl && imageUrl.includes('cloudinary')) {
        try {
            // Extraemos el "Public ID" de la URL
            // Ejemplo URL: https://res.cloudinary.com/.../upload/v12345/tesis_tesji/mifoto.jpg
            const parts = imageUrl.split('/');
            const uploadIndex = parts.indexOf('upload');
            // Tomamos lo que está después de "upload/" y "v12345/" y le quitamos el ".jpg"
            const publicIdConExtension = parts.slice(uploadIndex + 2).join('/');
            const publicId = publicIdConExtension.split('.')[0]; 
            
            // Le decimos a Cloudinary que la destruya
            await cloudinary.uploader.destroy(publicId);
            console.log('Imagen eliminada de la nube:', publicId);
        } catch (error) {
            console.error('Error al borrar imagen en Cloudinary:', error);
        }
    }
};

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
    if (req.file) {
        req.body.imagen = req.file.path; 
    }

    const {
        N_Impreso_Digital, Carrera, N_Cuenta_1, N_Cuenta_2, N_Cuenta_3, 
        Nombre_1, Nombre_2, Nombre_3, Opcion_de_Titulacion, Titulo, 
        Fecha_del_Trabajo, Color, imagen
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

const updateRegistro = (req, res) => {
    const id = req.params.id;
    const newData = req.body;

    conexion.query('SELECT imagen FROM Registros WHERE N_de_Registro = ?', [id], async (err, results) => {
        if (err) {
            console.error('Error al obtener registro para actualizar:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Registro no encontrado' });
        }

        const oldImagePath = results[0].imagen;
        let finalImagePath = oldImagePath; 

        // CASO 1: Se sube un archivo nuevo (borramos el viejo de la nube)
        if (req.file) {
            finalImagePath = req.file.path; 
            await borrarImagenCloudinary(oldImagePath); // <--- Llama a borrar
        } 
        // CASO 2: Se marcó la bandera para eliminar la imagen (borramos el viejo de la nube)
        else if (newData.deleteImage === '1') {
            finalImagePath = null; 
            await borrarImagenCloudinary(oldImagePath); // <--- Llama a borrar
        }

        newData.imagen = finalImagePath;
        delete newData.deleteImage; 

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

    // 1. Primero buscamos el registro para saber si tiene imagen
    conexion.query('SELECT imagen FROM Registros WHERE N_de_Registro = ?', [id], (err, results) => {
        if (err) {
            console.error('Error al buscar registro para eliminar:', err);
            return res.status(500).json({ error: 'Error interno' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Registro no encontrado' });
        }

        const imageUrl = results[0].imagen;

        // 2. Procedemos a eliminarlo de la base de datos
        const query = 'DELETE FROM Registros WHERE N_de_Registro = ?';
        conexion.query(query, [id], async (deleteErr, result) => {
            if (deleteErr) {
                console.error('Error al eliminar registro:', deleteErr);
                return res.status(500).json({ error: 'Error al eliminar registro' });
            }
            
            // 3. Si se eliminó de la BD correctamente, borramos la imagen de la nube
            await borrarImagenCloudinary(imageUrl); // <--- Llama a borrar

            res.json({ message: 'Registro eliminado exitosamente' });
        });
    });
};

module.exports = {
    getAllRegistros,
    getRegistroById,
    createRegistro,
    updateRegistro,
    deleteRegistro
};