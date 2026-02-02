import * as dotenv from 'dotenv';
dotenv.config();

import { ejecutarQuery } from '../inventariocore/inventariocore.repo';
import { obtenerPoolSql, cerrarPoolSql } from '../db/sqlserver.provider';

async function main() {
  try {
    await obtenerPoolSql();
    console.log('--- COLUMNAS Inv_inv_stock ---');
    const colsStock = await ejecutarQuery(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Inv_inv_stock'
        `);
    console.table(colsStock);

    console.log('--- COLUMNAS Inv_cat_productos ---');
    const colsProd = await ejecutarQuery(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Inv_cat_productos'
        `);
    console.table(colsProd);
  } catch (e) {
    console.error(e);
  } finally {
    await cerrarPoolSql();
  }
}

main();
