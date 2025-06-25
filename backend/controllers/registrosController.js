// controllers/registrosController.js
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
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
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
        UPDATE Registros SET
            N_Impreso_Digital = ?,
            Carrera = ?,
            N_Cuenta_1 = ?,
            N_Cuenta_2 = ?,
            N_Cuenta_3 = ?,
            Nombre_1 = ?,
            Nombre_2 = ?,
            Nombre_3 = ?,
            Opcion_de_Titulacion = ?,
            Titulo = ?,
            Fecha_del_Trabajo = ?,
            Color = ?,
            imagen = ?
        WHERE N_de_Registro = ?
    `;

    const values = [
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
        imagen,
        id
    ];

    conexion.query(query, values, (err, result) => {
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