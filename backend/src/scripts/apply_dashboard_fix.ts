import * as dotenv from 'dotenv';
dotenv.config();

import { obtenerPoolSql, cerrarPoolSql } from '../db/sqlserver.provider';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  try {
    await obtenerPoolSql();
    const pool = await obtenerPoolSql();

    const sqlPath = path.join(
      __dirname,
      '../db/scripts/fix_missing_features.sql',
    );
    console.log(`Leyendo SQL de: ${sqlPath}`);

    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
    const batches = sqlContent.split(/^GO\s*$/m);

    console.log(`Ejecutando ${batches.length} bloques SQL...`);

    for (const [i, batch] of batches.entries()) {
      if (!batch.trim()) continue;
      try {
        // console.log(`Ejecutando bloque ${i + 1}...`);
        await pool.request().query(batch);
        console.log(`✅ Bloque ${i + 1} OK`);
      } catch (err) {
        console.error(`❌ Error en bloque ${i + 1}:`, err);
      }
    }

    console.log('✅ Finalizado.');
  } catch (e) {
    console.error('❌ Error al aplicar SQL:', e);
  } finally {
    await cerrarPoolSql();
  }
}

main();
