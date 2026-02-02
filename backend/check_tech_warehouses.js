
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
        const res = await sql.query("SELECT idUsuario, nombre, correo, idAlmacenTecnico FROM Inv_seg_usuarios WHERE idRol = 3");
        console.log("TECH_WAREHOUSES_START");
        console.log(JSON.stringify(res.recordset, null, 2));
        console.log("TECH_WAREHOUSES_END");
    } catch (e) {
        console.error(e);
    } finally {
        await sql.close();
    }
})();
