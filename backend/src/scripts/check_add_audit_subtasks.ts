import * as dotenv from 'dotenv';
dotenv.config();

import { ejecutarQuery } from '../db/base.repo';

async function main() {
  console.log(
    'Verificando columnas faltantes en Inv_ope_proyecto_tareas (Auditoría y Subtareas)...',
  );
  try {
    // 1. Audit Columns for Soft Delete
    const auditCols = [
      'motivoDeshabilitacion',
      'deshabilitadoPor',
      'fechaDeshabilitacion',
    ];
    for (const col of auditCols) {
      const result = await ejecutarQuery(`
                SELECT 1 FROM sys.columns 
                WHERE Name = N'${col}' 
                AND Object_ID = Object_ID(N'dbo.Inv_ope_proyecto_tareas')
            `);

      if (result.length === 0) {
        console.log(`Agregando columna ${col}...`);
        let type = '';
        if (col === 'motivoDeshabilitacion') type = 'NVARCHAR(MAX)';
        if (col === 'deshabilitadoPor') type = 'INT';
        if (col === 'fechaDeshabilitacion') type = 'DATETIME';

        await ejecutarQuery(
          `ALTER TABLE dbo.Inv_ope_proyecto_tareas ADD ${col} ${type} NULL;`,
        );
        console.log(`✅ ${col} agregada.`);
      } else {
        console.log(`ℹ️ ${col} ya existe.`);
      }
    }

    // 2. Subtasks Column
    const subtaskCol = 'idTareaPadre';
    const resSub = await ejecutarQuery(`
            SELECT 1 FROM sys.columns 
            WHERE Name = N'${subtaskCol}' 
            AND Object_ID = Object_ID(N'dbo.Inv_ope_proyecto_tareas')
        `);

    if (resSub.length === 0) {
      console.log(`Agregando columna ${subtaskCol}...`);
      await ejecutarQuery(
        `ALTER TABLE dbo.Inv_ope_proyecto_tareas ADD ${subtaskCol} INT NULL;`,
      );

      // Add Self-Reference FK
      console.log('Agregando FK para Subtareas...');
      await ejecutarQuery(`
                ALTER TABLE dbo.Inv_ope_proyecto_tareas
                ADD CONSTRAINT FK_Tareas_Padre FOREIGN KEY (idTareaPadre) REFERENCES Inv_ope_proyecto_tareas(idTarea);
            `);
      console.log(`✅ ${subtaskCol} y FK agregadas.`);
    } else {
      console.log(`ℹ️ ${subtaskCol} ya existe.`);
    }
  } catch (error) {
    console.error('Error verificando/creando columnas:', error);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
