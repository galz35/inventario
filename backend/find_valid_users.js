const sql = require('mssql');

const config = {
    user: 'plan',
    password: 'admin123',
    server: '54.146.235.205',
    database: 'Bdplaner',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

(async () => {
    try {
        await sql.connect(config);

        const result = await sql.query(`
            SELECT TOP 5 u.nombre, u.correo, r.nombre as rol
            FROM p_Usuarios u
            JOIN p_UsuariosCredenciales c ON u.idUsuario = c.idUsuario
            LEFT JOIN p_Roles r ON u.idRol = r.idRol
        `);
        console.table(result.recordset);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await sql.close();
    }
})();
