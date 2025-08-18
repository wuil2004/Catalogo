const conexion = require('../conexion');

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

const updateRegistro = (req, res) => {
    // Misma lógica que en create: si se sube un nuevo archivo, actualizamos la ruta
    if (req.file) {
        req.body.imagen = `/uploads/${req.file.filename}`;
    }
    
    const id = req.params.id;
    const fieldsToUpdate = req.body;

    // Si no se envió una imagen nueva, el campo 'imagen' no existirá en el formulario
    // multipart/form-data. Esta consulta solo actualizará los campos presentes en `fieldsToUpdate`.
    const query = 'UPDATE Registros SET ? WHERE N_de_Registro = ?';
    
    conexion.query(query, [fieldsToUpdate, id], (err, result) => {
        if (err) {
            console.error('Error al actualizar registro:', err);
            return res.status(500).json({ error: 'Error al actualizar registro' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Registro no encontrado' });
        }
        res.json({ message: 'Registro actualizado exitosamente' });
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