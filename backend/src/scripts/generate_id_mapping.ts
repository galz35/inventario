import * as dotenv from 'dotenv';
dotenv.config();

import { ejecutarQuery } from '../db/base.repo';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('--- Generando Mapa de Migración (ID -> Carnet) ---');

  try {
    // 1. Obtener todos los usuarios activos
    const usuarios = await ejecutarQuery<{
      idUsuario: number;
      carnet: string;
    }>(`
            SELECT idUsuario, carnet 
            FROM Inv_seg_usuarios 
            WHERE activo = 1 AND carnet IS NOT NULL AND carnet <> ''
        `);

    // 2. Crear Mapa
    const mapping: Record<string, number> = {};
    usuarios.forEach((u) => {
      mapping[u.carnet] = u.idUsuario;
    });

    // 3. Generar JSON
    const outputPath = path.join(__dirname, 'migration_map.json');
    fs.writeFileSync(outputPath, JSON.stringify(mapping, null, 2));

    console.log(
      `✅ Mapa generado exitosamente con ${usuarios.length} usuarios.`,
    );
    console.log(`📁 Guardado en: ${outputPath}`);

    // 4. Generar Ejemplo de SQL de Recuperación
    console.log('\n--- Ejemplo de SQL para Recuperación de FKs ---');
    console.log(`
        -- Ejemplo: Actualizar creador de tareas basado en Carnet
        MERGE INTO Inv_ope_proyecto_tareas AS Target
        USING (SELECT idUsuario, carnet FROM Inv_seg_usuarios) AS Source
        ON Source.carnet = 'CARNET_DEL_OLD_SYSTEM' -- (Este es un ejemplo simplificado)
        -- En realidad, necesitaremos una tabla temporal de mapeo durante la migración
        `);
  } catch (error) {
    console.error('Error generando mapa:', error);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
