
const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER || 'plan',
    password: process.env.DB_PASSWORD || 'admin123',
    server: process.env.DB_HOST || '54.146.235.205',
    database: process.env.DB_NAME || 'inventario',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

(async () => {
    try {
        await sql.connect(config);
        console.log("Extending password column width...");
        await sql.query(`ALTER TABLE Inv_seg_usuarios ALTER COLUMN password NVARCHAR(255)`);
        console.log("Password column updated.");

        console.log("Extending refreshToken column width...");
        // Check if exists first or just try alter (might fail if not exists, but we know it does from checks)
        await sql.query(`ALTER TABLE Inv_seg_usuarios ALTER COLUMN refreshToken NVARCHAR(MAX)`);
        console.log("RefreshToken column updated.");

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await sql.close();
    }
})();
