
import * as dotenv from 'dotenv';
dotenv.config();
import { ejecutarQuery } from '../src/db/base.repo';

async function inspectV2() {
    try {
        console.log("=== 1. Estructura Usuarios (Top 10) ===");
        const users = await ejecutarQuery(`SELECT TOP 10 * FROM p_Usuarios ORDER BY idUsuario DESC`);
        // Log keys only to avoid PII dump, or just first row full
        if (users.length > 0) {
            console.log("Columnas:", Object.keys(users[0]).join(", "));
            console.log("Ejemplo:", JSON.stringify(users[0], null, 2));
        } else {
            console.log("No users found");
        }

        console.log("\n=== 2. Inventario FKs hacia p_Usuarios ===");
        const fks = await ejecutarQuery(`
            SELECT 
              fk.name AS FK,
              OBJECT_NAME(fk.parent_object_id) AS TablaHija,
              COL_NAME(fkc.parent_object_id, fkc.parent_column_id) AS ColumnaHija,
              OBJECT_NAME(fk.referenced_object_id) AS TablaPadre,
              COL_NAME(fkc.referenced_object_id, fkc.referenced_column_id) AS ColumnaPadre
            FROM sys.foreign_keys fk
            JOIN sys.foreign_key_columns fkc 
              ON fk.object_id = fkc.constraint_object_id
            WHERE OBJECT_NAME(fk.referenced_object_id) = 'p_Usuarios'
            ORDER BY TablaHija;
        `);
        console.log(JSON.stringify(fks, null, 2));

        console.log("\n=== 3. Estructura p_Tareas ===");
        const tareasCols = await ejecutarQuery(`
            SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'p_Tareas'
            ORDER BY ORDINAL_POSITION;
        `);
        console.log(JSON.stringify(tareasCols, null, 2));

    } catch (e) {
        console.error(e);
    }
}

inspectV2();
