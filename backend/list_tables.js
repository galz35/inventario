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
        const results = await sql.query("SELECT name FROM sys.tables ORDER BY name");
        console.log('--- TABLES IN DB ---');
        console.table(results.recordset);
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await sql.close();
    }
})();
