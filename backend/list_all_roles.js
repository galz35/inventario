
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
        const res = await sql.query("SELECT idRol, nombre FROM Inv_seg_roles");
        const fs = require('fs');
        const output = res.recordset.map(row => `${row.idRol} | ${row.nombre}`).join('\n');
        fs.writeFileSync('all_roles.txt', output);
        console.log("Output written to all_roles.txt");
    } catch (e) {
        console.error(e);
    } finally {
        await sql.close();
    }
})();
