import { sql, connect } from 'mssql';

const dbConfig = {
  user: 'plan',
  password: 'admin123',
  server: '54.146.235.205',
  database: 'inventario',
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

async function main() {
  try {
    const pool = await connect(dbConfig);
    console.log('✅ Connected to DB');

    const result = await pool.request().query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Inv_ope_ot'
        `);

    console.log('Columns in Inv_ope_ot:');
    console.table(result.recordset);

    pool.close();
  } catch (e: any) {
    console.error('❌ Error:', e.message);
  }
}

main();
