import 'dotenv/config';
import { ejecutarQuery, NVarChar } from '../db/base.repo';

async function checkSchema() {
  const tables = [
    'p_Notas',
    'Inv_ope_planes_trabajo',
    'Inv_ope_proyecto_bloqueos',
    'Inv_ope_checkin_tareas',
    'Inv_ope_proyecto_tareas',
    'Inv_ope_proyecto_tarea_asignados',
  ];
  console.log('--- ESTRUCTURA DE TABLAS ---');
  for (const table of tables) {
    try {
      const cols = await ejecutarQuery<any>(
        `
                SELECT COLUMN_NAME, DATA_TYPE 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = @table
            `,
        { table: { valor: table, tipo: NVarChar } },
      );
      console.log(`\nTABLA: ${table}`);
      cols.forEach((c) => console.log(` - ${c.COLUMN_NAME} (${c.DATA_TYPE})`));
    } catch (e: any) {
      console.log(`Error leyendo ${table}: ${e.message}`);
    }
  }
  process.exit(0);
}

checkSchema();
