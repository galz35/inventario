
const sql = require('mssql');
require('dotenv').config();

async function checkUser() {
    const config = {
        server: process.env.MSSQL_HOST || '54.146.235.205',
        port: parseInt(process.env.MSSQL_PORT || '1433'),
        user: process.env.MSSQL_USER || 'plan',
        password: process.env.MSSQL_PASSWORD || 'admin123',
        database: process.env.MSSQL_DATABASE || 'Bdplaner',
        options: {
            encrypt: true,
            trustServerCertificate: true
        }
    };

    try {
        let pool = await sql.connect(config);
        let result = await pool.request().query("SELECT idUsuario, carnet, nombreCompleto, correo FROM p_Usuarios WHERE correo LIKE '%gustavo.lira%'");
        console.log(JSON.stringify(result.recordset, null, 2));
        await sql.close();
    } catch (err) {
        console.error(err);
    }
}

checkUser();
