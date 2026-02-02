
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

        console.log("🔍 DIAGNÓSTICO DE DATOS 🔍\n");

        // 1. Check OTs
        const ots = await sql.query(`
            SELECT TOP 3 idOT, cliente, estado, idTecnicoAsignado, fechaCreacion 
            FROM Inv_ope_ot 
            ORDER BY idOT DESC
        `);
        console.log("📋 OTs:");
        console.table(ots.recordset);

        // 2. STOCK
        const stock = await sql.query(`
             SELECT TOP 5 s.idStock, s.cantidad 
             FROM Inv_inv_stock s
        `);
        console.log("📋 STOCK SAMPLE:");
        console.table(stock.recordset);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await sql.close();
    }
})();
