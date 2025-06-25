const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const conexion = require('../conexion');
const SECRET_KEY = 'Mi secreto'; // Cambia esto por una clave segura

const saltRounds = 10;

// Función para registrar un nuevo admin
const registerAdmin = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username y password son requeridos' });
  }

  // Hash de la contraseña
  bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
      return res.status(500).json({ error: 'Error al hashear la contraseña' });
    }

    const query = 'INSERT INTO admins (username, password) VALUES (?, ?)';
    conexion.query(query, [username, hash], (error, results) => {
      if (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ error: 'El username ya existe' });
        }
        return res.status(500).json({ error: 'Error al crear admin' });
      }

      res.status(201).json({ message: 'Admin creado exitosamente', id: results.insertId });
    });
  });
};

// Función para login
const loginAdmin = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username y password son requeridos' });
  }

  const query = 'SELECT * FROM admins WHERE username = ?';
  conexion.query(query, [username], (error, results) => {
    if (error) {
      return res.status(500).json({ error: 'Error al buscar admin' });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const admin = results[0];

    // Comparar contraseñas
    bcrypt.compare(password, admin.password, (err, result) => {
      if (err || !result) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      // Crear token JWT
      const token = jwt.sign(
        { id: admin.id, username: admin.username },
        SECRET_KEY,
        { expiresIn: '1h' }
      );

      res.json({ token, username: admin.username });
    });
  });
};

// Función para obtener todos los admins (protegido)
const getAllAdmins = (req, res) => {
  const query = 'SELECT id, username FROM admins'; // No devolver passwords
  conexion.query(query, (error, results) => {
    if (error) {
      return res.status(500).json({ error: 'Error al obtener admins' });
    }
    res.json(results);
  });
};

// Función para obtener un admin por ID (protegido)
const getAdminById = (req, res) => {
  const { id } = req.params;

  const query = 'SELECT id, username FROM admins WHERE id = ?';
  conexion.query(query, [id], (error, results) => {
    if (error) {
      return res.status(500).json({ error: 'Error al obtener admin' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Admin no encontrado' });
    }

    res.json(results[0]);
  });
};

// Función para actualizar un admin (protegido)
const updateAdmin = (req, res) => {
  const { id } = req.params;
  const { username, password } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username es requerido' });
  }

  if (password) {
    // Si se proporciona password, hashearla
    bcrypt.hash(password, saltRounds, (err, hash) => {
      if (err) {
        return res.status(500).json({ error: 'Error al hashear la contraseña' });
      }

      const query = 'UPDATE admins SET username = ?, password = ? WHERE id = ?';
      conexion.query(query, [username, hash, id], (error, results) => {
        if (error) {
          if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'El username ya existe' });
          }
          return res.status(500).json({ error: 'Error al actualizar admin' });
        }

        if (results.affectedRows === 0) {
          return res.status(404).json({ error: 'Admin no encontrado' });
        }

        res.json({ message: 'Admin actualizado exitosamente' });
      });
    });
  } else {
    // Actualizar solo el username
    const query = 'UPDATE admins SET username = ? WHERE id = ?';
    conexion.query(query, [username, id], (error, results) => {
      if (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ error: 'El username ya existe' });
        }
        return res.status(500).json({ error: 'Error al actualizar admin' });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ error: 'Admin no encontrado' });
      }

      res.json({ message: 'Admin actualizado exitosamente' });
    });
  }
};

// Función para eliminar un admin (protegido)
const deleteAdmin = (req, res) => {
  const { id } = req.params;

  const query = 'DELETE FROM admins WHERE id = ?';
  conexion.query(query, [id], (error, results) => {
    if (error) {
      return res.status(500).json({ error: 'Error al eliminar admin' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Admin no encontrado' });
    }

    res.json({ message: 'Admin eliminado exitosamente' });
  });
};

module.exports = {
  registerAdmin,
  loginAdmin,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin
};