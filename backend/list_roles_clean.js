
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
        const result = await sql.query("SELECT idRol, nombre FROM Inv_seg_roles");
        console.log("ROLES_START");
        console.log(JSON.stringify(result.recordset, null, 2));
        console.log("ROLES_END");
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await sql.close();
    }
})();
