
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
        const res = await sql.query(`
            SELECT u.nombre, r.nombre as rolNombre, u.correo 
            FROM Inv_seg_usuarios u 
            JOIN Inv_seg_roles r ON u.idRol = r.idRol 
            WHERE u.correo IN ('roberto.central@empresa.com', 'sofia.lopez@empresa.com', 'diana.martinez@empresa.com', 'juan.rodriguez@empresa.com')
        `);
        const fs = require('fs');
        const output = res.recordset.map(row => `${row.nombre} | ${row.rolNombre} | ${row.correo}`).join('\n');
        fs.writeFileSync('role_mapping_output.txt', output);
        console.log("Output written to role_mapping_output.txt");
    } catch (e) {
        console.error(e);
    } finally {
        await sql.close();
    }
})();
