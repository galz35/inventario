import * as dotenv from 'dotenv';
dotenv.config();
import { obtenerPoolSql, cerrarPoolSql } from '../db/sqlserver.provider';

async function main() {
  try {
    const pool = await obtenerPoolSql();
    const result = await pool
      .request()
      .query(
        "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME",
      );
    console.table(result.recordset);
  } catch (e) {
    console.error('Error fetching tables:', e);
  } finally {
    await cerrarPoolSql();
  }
}
main();
