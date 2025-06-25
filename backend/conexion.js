const mysql = require('mysql2');

const conexion = mysql.createConnection({
  host: 'localhost',      // Conexión a localhost, ya que estás corriendo Node.js en tu máquina local
  user: 'root',           // Usuario de la base de datos
  password: 'root123',    // Contraseña de la base de datos
  database: 'catalogo_pro', // Nombre de la base de datos
  port: 3307              // Usa el puerto mapeado desde Docker (3307)
});

conexion.connect((err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err);
  } else {
    console.log('Conexión exitosa');
  }
});

module.exports = conexion;
