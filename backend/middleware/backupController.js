// backend/controllers/backupController.js

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const dbConfig = require('../conexion');
const conexion = require('../conexion');

const backupDir = path.join(__dirname, '..', 'backups');

exports.listBackups = (req, res) => {
    try {
        if (!fs.existsSync(backupDir)) {
            return res.json([]);
        }
        const files = fs.readdirSync(backupDir)
            .filter(file => file.endsWith('.sql'))
            .sort((a, b) => b.localeCompare(a));
        res.json(files);
    } catch (error) {
        console.error("Error al listar backups:", error);
        res.status(500).json({ error: 'No se pudieron listar las copias de seguridad.' });
    }
};

exports.restoreBackup = (req, res) => {
    const { filename } = req.body;
    const adminUsername = req.admin.username;

    if (!filename || !/^[backup-\d{4}-\d{2}-\d{2}\.sql]+$/.test(filename)) {
        return res.status(400).json({ error: 'Nombre de archivo no válido.' });
    }
    const backupFilePath = path.join(backupDir, filename);

    if (!fs.existsSync(backupFilePath)) {
        return res.status(404).json({ error: 'El archivo de backup no fue encontrado.' });
    }

    const command = `mysql --host=${dbConfig.host} --port=${dbConfig.port} --user=${dbConfig.user} --password="${dbConfig.password}" ${dbConfig.database} < "${backupFilePath}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error al restaurar el backup: ${error.message}`);
            return res.status(500).json({ error: `Error al restaurar la base de datos.` });
        }

        console.log(`Restauración desde '${filename}' completada por ${adminUsername}.`);

        const logQuery = 'INSERT INTO restore_logs (admin_username, backup_filename) VALUES (?, ?)';
        conexion.query(logQuery, [adminUsername, filename], (logError) => {
            if (logError) {
                console.error("Error al guardar el log de restauración:", logError);
            } else {
                console.log("Log de restauración guardado exitosamente.");
            }
        });

        res.json({ message: 'La base de datos ha sido restaurada exitosamente.' });
    });
};

exports.getRestoreLogs = (req, res) => {
    const query = 'SELECT * FROM restore_logs ORDER BY timestamp DESC LIMIT 50';
    conexion.query(query, (error, results) => {
        if (error) {
            console.error("Error al obtener logs:", error);
            return res.status(500).json({ error: 'Error al obtener el historial de restauraciones.' });
        }
        res.json(results);
    });
};

exports.getLatestRestoreTimestamp = (req, res) => {
    const query = 'SELECT timestamp FROM restore_logs ORDER BY timestamp DESC LIMIT 1';
    conexion.query(query, (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Error al verificar el estado de la base de datos.' });
        }
        res.json({ lastRestore: results.length > 0 ? results[0].timestamp : null });
    });
};