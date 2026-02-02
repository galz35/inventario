const sql = require('mssql');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const config = {
    user: process.env.MSSQL_USER || 'plan',
    password: process.env.MSSQL_PASSWORD || 'admin123',
    server: process.env.MSSQL_HOST || '54.146.235.205',
    database: 'master', // Start with master to create the database
    options: {
        encrypt: process.env.MSSQL_ENCRYPT === 'true',
        trustServerCertificate: process.env.MSSQL_TRUST_CERT === 'true'
    }
};

async function migrate() {
    let pool;
    try {
        console.log(`🔌 Conectando a ${config.server}...`);
        pool = await sql.connect(config);

        const dbName = 'inventario';

        // 1. Crear Base de Datos
        console.log(`🛠️ Verificando base de datos "${dbName}"...`);
        await pool.query(`
            IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = '${dbName}')
            BEGIN
                CREATE DATABASE ${dbName};
                PRINT 'Base de datos creada.';
            END
        `);

        await pool.close();

        // 2. Conectar a la nueva base de datos
        config.database = dbName;
        console.log(`🔌 Conectando a la base de datos "${dbName}"...`);
        pool = await sql.connect(config);

        // 3. Leer y ejecutar el script principal
        const scriptPath = path.join(__dirname, '../docs/diseno_db_fase1.sql');
        console.log(`📄 Leyendo script: ${scriptPath}`);
        const sqlContent = fs.readFileSync(scriptPath, 'utf8');

        // Separar por GO
        const blocks = sqlContent.split(/\nGO\s*\n|\r\nGO\s*\r\n/i);
        console.log(`🚀 Ejecutando ${blocks.length} bloques SQL...`);

        for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i].trim();
            if (!block) continue;

            try {
                await pool.query(block);
                if (i % 10 === 0) console.log(`  > Progreso: ${i}/${blocks.length} bloques.`);
            } catch (err) {
                console.error(`❌ Error en bloque ${i}:`, err.message);
                // console.error('Bloque:', block);
            }
        }

        console.log('✅ Migración completada exitosamente.');

    } catch (err) {
        console.error('❌ Error fatal en la migración:', err);
    } finally {
        if (pool) await pool.close();
    }
}

migrate();
