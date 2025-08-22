const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Middleware para crear un backup diario de la base de datos que corre en un contenedor Docker.
 */
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
        console.log('El backup diario ya existe. Saltando...');
        return next();
    }

    console.log(`Creando backup para el día ${day}-${month}-${year} desde el contenedor...`);

    // --- COMANDO CORREGIDO SIN COMILLAS SIMPLES PARA COMPATIBILIDAD CON WINDOWS ---
    const command = `docker exec catalogo_pro mysqldump -u root -p"root123" catalogo_pro > "${backupFilePath}"`;

    exec(command, (error, stdout, stderr) => {
        if (error || stderr) {
            console.error(`Error/Advertencia al crear el backup desde Docker: ${error?.message || stderr}`);
        } else {
            console.log(`Backup '${backupFileName}' creado exitosamente desde el contenedor.`);
        }
        next();
    });
};

module.exports = {
    createDailyBackup
};