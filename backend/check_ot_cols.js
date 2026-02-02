
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
        const result = await sql.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Inv_ope_ot'");
        console.log("COLUMNS Inv_ope_ot:");
        result.recordset.forEach(r => console.log(` - ${r.COLUMN_NAME}`));
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await sql.close();
    }
})();
