
const bcrypt = require('bcrypt');
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
        console.log('Generando hash...');
        const hash = await bcrypt.hash('123456', 10);

        await sql.connect(config);

        // Force update for everyone with @empresa.com
        console.log("Forcing update for all @empresa.com users...");
        const result = await sql.query(`
            UPDATE Inv_seg_usuarios 
            SET password = '${hash}', activo = 1 
            WHERE correo LIKE '%@empresa.com'
        `);
        console.log(`Rows affected: ${result.rowsAffected}`);

        // Verify Sofia specifically
        const ver = await sql.query(`SELECT password FROM Inv_seg_usuarios WHERE correo = 'sofia.lopez@empresa.com'`);
        const user = ver.recordset[0];
        if (user) {
            const match = await bcrypt.compare('123456', user.password);
            console.log(`Sofia match immediately after update? ${match}`);
        } else {
            console.log("Sofia not found.");
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await sql.close();
    }
})();
