const jwt = require('jsonwebtoken');

const SECRET_KEY = 'Mi secreto';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token de autenticación no proporcionado' });
  }
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
    req.admin = decoded;
    next();
  });
};

module.exports = {
  authenticateToken
};