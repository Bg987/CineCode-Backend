require('dotenv').config();
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const url = require('url');

// Parse the DATABASE_URL from .env
const dbUrl = new URL(process.env.DB_URL);
const dbHost = dbUrl.hostname;
const dbPort = dbUrl.port;
const dbUser = dbUrl.username;
const dbPassword = dbUrl.password;
const dbName = dbUrl.pathname.replace('/', '');

// Backup directory
const backupDir = path.join(__dirname, '../data/backups');
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

// Function to create backup
const createBackup = () => {
    const date = new Date();
    const Datex = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
    const backupFile = path.join(backupDir, `railwaybackup_${Datex}.sql`);

    const command = `mysqldump -h ${dbHost} -P ${dbPort} -u ${dbUser} -p${dbPassword} ${dbName} > "${backupFile}"`;

    console.log('Starting Railway DB backup...');
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Error during backup: ${stderr}`);
        } else {
            console.log(`✅ Backup completed successfully: ${backupFile}`);
        }
    });
};

createBackup();
