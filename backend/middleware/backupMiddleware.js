// backend/middleware/backupMiddleware.js

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const dbConfig = require('../conexion'); // Importamos la configuración

const createDailyBackup = (req, res, next) => {
    const backupDir = path.join(__dirname, '..', 'backups');

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const backupFileName = `backup-${year}-${month}-${day}.sql`;
    const backupFilePath = path.join(backupDir, backupFileName);

    if (fs.existsSync(backupFilePath)) {
        console.log('El backup de hoy ya existe. Saltando...');
        return next();
    }

    console.log(`Creando backup para el día ${day}-${month}-${year}...`);

    const command = `mysqldump --host=${dbConfig.host} --port=${dbConfig.port} --user=${dbConfig.user} --password="${dbConfig.password}" ${dbConfig.database} > "${backupFilePath}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error al crear el backup: ${error.message}`);
        }
        if (stderr) {
            console.error(`Error (stderr) al crear el backup: ${stderr}`);
        }
        if(!error && !stderr) {
            console.log(`Backup '${backupFileName}' creado exitosamente.`);
        }
        next();
    });
};

module.exports = {
    createDailyBackup
};