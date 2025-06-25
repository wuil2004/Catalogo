const jwt = require('jsonwebtoken');

const SECRET_KEY = 'Mi secreto'; // Cambia esto por una clave segura

const authenticateToken = (req, res, next) => {
  // Obtener el token del header 'Authorization'
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token de autenticación no proporcionado' });
  }

  // Verificar el token
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
    
    // Añadir los datos del admin al request
    req.admin = decoded;
    next();
  });
};

module.exports = {
  authenticateToken
};