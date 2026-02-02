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

        console.log('--- USERS IN p_Usuarios ---');
        const pUsers = await sql.query(`
            SELECT TOP 5 u.idUsuario, u.nombre, u.correo, r.nombre as rolNombre 
            FROM p_Usuarios u 
            LEFT JOIN p_Roles r ON u.idRol = r.idRol
        `);
        console.table(pUsers.recordset);

        console.log('--- USERS IN Inv_seg_usuarios ---');
        const invUsers = await sql.query(`
            SELECT TOP 5 u.idUsuario, u.nombre, u.correo, r.nombre as rolNombre 
            FROM Inv_seg_usuarios u 
            LEFT JOIN Inv_seg_roles r ON u.idRol = r.idRol
        `);
        console.table(invUsers.recordset);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await sql.close();
    }
})();
