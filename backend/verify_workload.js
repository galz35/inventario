
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
        const result = await sql.query(`
            SELECT u.nombre, u.correo, COUNT(o.idOT) as total_ots
            FROM Inv_seg_usuarios u
            JOIN Inv_ope_ot o ON u.idUsuario = o.idTecnicoAsignado
            WHERE u.idRol = 4
            GROUP BY u.nombre, u.correo
        `);
        console.log("CARGA DE TRABAJO ACTUAL (OTs por Técnico):");
        console.table(result.recordset);
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await sql.close();
    }
})();
