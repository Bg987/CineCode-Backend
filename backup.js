const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Database configuration
const dbUser = 'root'; // Replace with your database username
const dbName = 'movie_app'; // Replace with your database name

// Backup directory set to ../data/backups
const backupDir = path.join(__dirname, '../data/backups');

// Ensure the backup directory exists
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

// Function to create a backup
const createBackup = () => {
    const timestamp = new Date();
    const data = new Date();
    const Datex = data.getDate() + "-" + (data.getMonth() + 1) + "-" + data.getFullYear();
    const backupFile = path.join(backupDir, `backup_${Datex}.sql`);
    const command = `"C:\\xampp\\mysql\\bin\\mysqldump" -u ${dbUser}  ${dbName} > "${backupFile}"`;
    console.log('Starting backup...');
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error during backup: ${stderr}`);
        } else {
            console.log(`Backup completed successfully: ${backupFile}`);
        }
    });
};

createBackup();
