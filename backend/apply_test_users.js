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
        await sql.connect(config);
        const script = fs.readFileSync(path.join(__dirname, 'sql', 'inv_seed_test_users.sql'), 'utf8');
        const batches = script.split(/\sGO\s/i);
        for (let batch of batches) {
            if (batch.trim()) await sql.query(batch);
        }
        console.log('Test users applied.');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await sql.close();
    }
})();
