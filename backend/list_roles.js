
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
        const roles = await sql.query("SELECT * FROM Inv_seg_roles");
        console.log("ROLES:");
        console.dir(roles.recordset);
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await sql.close();
    }
})();
