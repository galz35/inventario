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

        console.log('--- ROLES IN p_Roles ---');
        const roles = await sql.query(`SELECT * FROM p_Roles`);
        console.table(roles.recordset);

        console.log('--- CREDENTIALS COUNT ---');
        const creds = await sql.query(`SELECT COUNT(*) as count FROM p_UsuariosCredenciales`);
        console.table(creds.recordset);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await sql.close();
    }
})();
