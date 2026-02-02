
import * as dotenv from 'dotenv';
dotenv.config();
import { ejecutarQuery } from '../src/db/base.repo';

async function analyze() {
    try {
        console.log("=== PASO 1: Tablas con 'carnet' ===");
        const q1 = `
            SELECT t.name AS table_name, c.name AS column_name
            FROM sys.columns c
            JOIN sys.tables t ON c.object_id = t.object_id
            WHERE c.name LIKE '%carnet%'
            ORDER BY t.name;
        `;
        const r1 = await ejecutarQuery(q1);
        console.log(JSON.stringify(r1, null, 2));

        console.log("\n=== PASO 3: Candidatas Agenda (Tablas con 'Agenda', 'Dia', 'Foco') ===");
        const qTables = `
            SELECT t.name 
            FROM sys.tables t 
            WHERE t.name LIKE '%Agenda%' OR t.name LIKE '%Dia%' OR t.name LIKE '%Foco%'
        `;
        const rTables = await ejecutarQuery(qTables);
        console.log(JSON.stringify(rTables, null, 2));

        const candidates = rTables.map((r: any) => r.name);
        // Add likely candidates if not found
        if (!candidates.includes('p_Foco')) candidates.push('p_Foco');
        if (!candidates.includes('p_Agenda')) candidates.push('p_Agenda');

        for (const tbl of candidates) {
            console.log(`\n=== DETAIL: ${tbl} ===`);
            // Check if exists
            const check = await ejecutarQuery(`SELECT 1 FROM sys.tables WHERE name = '${tbl}'`);
            if (check.length === 0) {
                console.log("(No existe)");
                continue;
            }

            // Structure
            const cols = await ejecutarQuery(`
                SELECT COLUMN_NAME, DATA_TYPE 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = '${tbl}'
            `);
            console.log("Estructura:", JSON.stringify(cols, null, 2));

            // Data
            const rows = await ejecutarQuery(`SELECT TOP 5 * FROM ${tbl} ORDER BY 1 DESC`);
            console.log("Datos:", JSON.stringify(rows, null, 2));
        }

    } catch (e) {
        console.error(e);
    }
}

analyze();
