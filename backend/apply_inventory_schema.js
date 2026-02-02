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

        const sqlPath = path.join(__dirname, '..', 'docs', 'diseno_db_fase1.sql');
        let script = fs.readFileSync(sqlPath, 'utf8');

        // Remove USE statements if any, we are already connected to Bdplaner
        script = script.replace(/USE\s+\[?\w+\]?;/gi, '');

        const batches = script.split(/\sGO\s/i);

        for (let batch of batches) {
            batch = batch.trim();
            if (batch) {
                console.log('Executing batch...');
                try {
                    await sql.query(batch);
                } catch (err) {
                    // Ignore errors if table already exists as many IF OBJECT_ID checks are there
                    if (!err.message.includes('already exists')) {
                        console.error('Error executing batch:', err.message);
                    }
                }
            }
        }
        console.log('Inventory Schema applied.');

    } catch (e) {
        console.error('Connection Error:', e);
    } finally {
        await sql.close();
    }
})();
