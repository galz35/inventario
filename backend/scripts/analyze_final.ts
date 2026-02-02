
import * as dotenv from 'dotenv';
dotenv.config();
import { ejecutarQuery } from '../src/db/base.repo';

async function analyzeFinal() {
    try {
        console.log("\n=== PASO 3: Heurística de Columnas ===");
        const q3 = `
            SELECT t.name AS table_name,
                SUM(CASE WHEN c.name LIKE '%fecha%' THEN 1 ELSE 0 END) AS cols_fecha,
                SUM(CASE WHEN c.name LIKE '%objetivo%' THEN 1 ELSE 0 END) AS cols_objetivo,
                SUM(CASE WHEN c.name LIKE '%agenda%' THEN 1 ELSE 0 END) AS cols_agenda,
                SUM(CASE WHEN c.name LIKE '%dia%' THEN 1 ELSE 0 END) AS cols_dia,
                SUM(CASE WHEN c.name LIKE '%carnet%' THEN 1 ELSE 0 END) AS cols_carnet,
                SUM(CASE WHEN LOWER(c.name) LIKE '%idusuario%' THEN 1 ELSE 0 END) AS cols_idusuario
            FROM sys.columns c
            JOIN sys.tables t ON c.object_id = t.object_id
            GROUP BY t.name
            HAVING (SUM(CASE WHEN c.name LIKE '%agenda%' THEN 1 ELSE 0 END) > 0
                OR SUM(CASE WHEN c.name LIKE '%dia%' THEN 1 ELSE 0 END) > 0
                OR t.name = 'p_FocoDiario')
            ORDER BY cols_agenda DESC, cols_dia DESC;
        `;
        const r3 = await ejecutarQuery(q3);
        console.log(JSON.stringify(r3, null, 2));

        console.log("\n=== PASO 4: Análisis p_FocoDiario ===");
        // Estructura
        const qStruct = `
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'p_FocoDiario'
        `;
        const rStruct = await ejecutarQuery(qStruct);
        console.log("Estructura:", JSON.stringify(rStruct, null, 2));

        // Datos recientes
        const qData = `SELECT TOP 20 * FROM p_FocoDiario ORDER BY fecha DESC`;
        const rData = await ejecutarQuery(qData);
        console.log("Datos:", JSON.stringify(rData, null, 2));

        // Conteos calidad (check if carnet exists in this table, likely not based on previous step, but verification)
        // Check columns first to avoid error
        const hasCarnet = rStruct.some((c: any) => c.COLUMN_NAME === 'carnet');
        const hasIdUsuario = rStruct.some((c: any) => c.COLUMN_NAME === 'idUsuario');

        let qCount = `SELECT COUNT(*) as total`;
        if (hasCarnet) qCount += `, SUM(CASE WHEN carnet IS NULL THEN 1 ELSE 0 END) as sin_carnet`;
        if (hasIdUsuario) qCount += `, SUM(CASE WHEN idUsuario IS NULL THEN 1 ELSE 0 END) as sin_idUsuario`;
        qCount += ` FROM p_FocoDiario`;

        const rCount = await ejecutarQuery(qCount);
        console.log("Conteos:", JSON.stringify(rCount, null, 2));

    } catch (e) { console.error(e); }
}
analyzeFinal();
