
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
        const result = await sql.query(`SELECT idUsuario, nombre, correo, password FROM Inv_seg_usuarios WHERE nombre LIKE '%Sofia%'`);
        console.table(result.recordset);

        // Let's also verify bcrypt manually here
        const bcrypt = require('bcrypt');
        const user = result.recordset[0];
        if (user) {
            console.log(`Verifying password for ${user.nombre} (${user.correo})...`);
            const match = await bcrypt.compare('123456', user.password);
            console.log(`Match? ${match}`);
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await sql.close();
    }
})();
