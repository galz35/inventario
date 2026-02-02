
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

        console.log("🔍 MOVIMIENTOS RECIENTES 🔍\n");

        const movs = await sql.query(`
            SELECT TOP 5 *
            FROM Inv_inv_movimientos 
            ORDER BY idMovimiento DESC
        `);
        console.table(movs.recordset);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await sql.close();
    }
})();
