const mysql = require('mysql2');

// Objeto de configuración que podemos exportar
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'root123',
  database: 'catalogo_pro',
  port: 3307
};

const conexion = mysql.createConnection(dbConfig);

conexion.connect((err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err);
  } else {
    console.log('Conexión exitosa a la base de datos.');
  }
});

// Exportamos la conexión para que la usen los controladores
module.exports = conexion;
// Exportamos la configuración para que la use el sistema de backups
module.exports.dbConfig = dbConfig;