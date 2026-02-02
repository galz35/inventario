const sql = require('mssql');
const fs = require('fs');
const path = require('path');

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
        console.log('Connecting to DB at 54.146.235.205...');
        await sql.connect(config);

        const sqlPath = path.join(__dirname, 'sql', 'inv_proyectos_upsert.sql');
        const script = fs.readFileSync(sqlPath, 'utf8');

        // Split by GO
        const batches = script.split(/\sGO\s/i);

        for (const batch of batches) {
            if (batch.trim()) {
                console.log('Executing batch...');
                await sql.query(batch);
            }
        }
        console.log('SQL applied successfully.');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await sql.close();
    }
})();
