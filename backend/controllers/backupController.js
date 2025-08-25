// backend/controllers/backupController.js

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Archivo que guardará la fecha de la última restauración
const lastRestoreLogFile = path.join(__dirname, '..', 'last_restore.txt');
const backupDir = path.join(__dirname, '..', 'backups');

/**
 * Obtiene la lista de archivos de backup disponibles.
 */
exports.listBackups = (req, res) => {
    try {
        if (!fs.existsSync(backupDir)) {
            // Si la carpeta no existe, la creamos vacía
            fs.mkdirSync(backupDir, { recursive: true });
            return res.json([]);
        }
        const files = fs.readdirSync(backupDir)
            .filter(file => file.endsWith('.sql'))
            .sort((a, b) => b.localeCompare(a)); // Ordenar de más reciente a más antiguo
        res.json(files);
    } catch (error) {
        console.error("Error al listar backups:", error);
        res.status(500).json({ error: 'No se pudieron listar las copias de seguridad.' });
    }
};

/**
 * Restaura la base de datos y guarda la fecha en nuestro archivo de registro.
 */
exports.restoreBackup = (req, res) => {
    const { filename } = req.body;

    // Validación de seguridad del nombre de archivo
    if (!filename || !/^[backup-\d{4}-\d{2}-\d{2}\.sql]+$/.test(filename)) {
        return res.status(400).json({ error: 'Nombre de archivo no válido.' });
    }
    const backupFilePath = path.join(backupDir, filename);

    if (!fs.existsSync(backupFilePath)) {
        return res.status(404).json({ error: 'El archivo de backup no fue encontrado.' });
    }
    
    // Comando para restaurar usando Docker y redirigiendo el archivo .sql
    // Usa -i para modo interactivo, lo que permite pasar el archivo de entrada
    const command = `docker exec -i catalogo_pro mysql -u root -p"root123" catalogo_pro < "${backupFilePath}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error al restaurar el backup: ${error.message}`);
            return res.status(500).json({ error: `Error al restaurar la base de datos.` });
        }
        
        // Guardamos la fecha y hora actual en el archivo de registro.
        fs.writeFileSync(lastRestoreLogFile, new Date().toISOString());
        
        console.log(`Restauración desde '${filename}' completada.`);
        res.json({ message: 'La base de datos ha sido restaurada exitosamente.' });
    });
};

/**
 * Lee la fecha y hora de la última restauración desde el archivo.
 */
exports.getLatestRestoreTimestamp = (req, res) => {
    try {
        if (fs.existsSync(lastRestoreLogFile)) {
            const timestamp = fs.readFileSync(lastRestoreLogFile, 'utf-8');
            res.json({ lastRestore: timestamp });
        } else {
            res.json({ lastRestore: null }); // No ha habido restauraciones
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al verificar el estado de la base de datos.' });
    }
};