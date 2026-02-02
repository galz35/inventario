import * as dotenv from 'dotenv';
dotenv.config();
import { obtenerPoolSql, cerrarPoolSql } from '../db/sqlserver.provider';

async function main() {
  try {
    const pool = await obtenerPoolSql();
    const result = await pool
      .request()
      .query(
        "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE 'Inv_activos%' OR TABLE_NAME LIKE 'Inv_log_activos%' ",
      );
    console.log('--- TABLES FOUND ---');
    console.table(result.recordset);

    // Also check if Inv_activos_trazabilidad exists and list cols
    if (
      result.recordset.some((r) => r.TABLE_NAME === 'Inv_activos_trazabilidad')
    ) {
      const result2 = await pool
        .request()
        .query(
          "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Inv_activos_trazabilidad'",
        );
      console.log('--- Columns in Inv_activos_trazabilidad ---');
      console.table(result2.recordset);
    }
  } catch (e) {
    console.error('Error fetching tables:', e);
  } finally {
    await cerrarPoolSql();
  }
}
main();
