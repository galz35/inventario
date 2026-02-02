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
        console.log('Connecting to DB...');
        await sql.connect(config);

        const sqlPath = path.join(__dirname, 'sql', 'inv_planificacion_wbs.sql');
        const script = fs.readFileSync(sqlPath, 'utf8');
        const batches = script.split(/\sGO\s/i);

        for (const batch of batches) {
            if (batch.trim()) {
                console.log('Executing batch...');
                try {
                    await sql.query(batch);
                } catch (err) {
                    console.error('Error executing batch:', err.message);
                }
            }
        }
        console.log('WBS SQL applied.');

    } catch (e) {
        console.error('Connection Error:', e);
    } finally {
        await sql.close();
    }
})();
