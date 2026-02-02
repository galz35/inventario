import { sql, connect } from 'mssql';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'Password123!',
  server: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'inventario',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

async function main() {
  try {
    const pool = await connect(dbConfig);
    console.log('✅ Conectado a DB');

    const res = await pool
      .request()
      .query(
        "SELECT name FROM sys.tables WHERE name LIKE 'Inv_%' OR name LIKE 'p_%'",
      );
    console.log('Tablas encontradas:');
    console.table(res.recordset);

    // Verificar usuario
    try {
      const userRes = await pool
        .request()
        .query('SELECT TOP 1 * FROM Inv_seg_usuarios');
      console.log(
        'Usuario de muestra en Inv_seg_usuarios:',
        userRes.recordset[0],
      );
    } catch (e) {
      console.error('❌ Error leyendo Inv_seg_usuarios:', e.message);
    }

    try {
      const oldUserRes = await pool
        .request()
        .query('SELECT TOP 1 * FROM p_Usuarios');
      console.log('Usuario de muestra en p_Usuarios:', oldUserRes.recordset[0]);
    } catch (e) {
      console.log('ℹ️ Tabla p_Usuarios no accesible.');
    }

    pool.close();
  } catch (e) {
    console.error('Error FATAL:', e);
  }
}

main();
