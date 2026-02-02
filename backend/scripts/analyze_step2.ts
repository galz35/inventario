
import * as dotenv from 'dotenv';
dotenv.config();
import { ejecutarQuery } from '../src/db/base.repo';

async function analyzeStep2() {
    try {
        const q2 = `
            SELECT s.name AS schema_name, t.name AS table_name, c.name AS column_name
            FROM sys.columns c
            JOIN sys.tables t ON c.object_id = t.object_id
            JOIN sys.schemas s ON t.schema_id = s.schema_id
            WHERE c.name IN ('idUsuario','id_usuario','IdUsuario')
            ORDER BY s.name, t.name;
        `;
        const r2 = await ejecutarQuery(q2);
        console.log(JSON.stringify(r2, null, 2));
    } catch (e) { console.error(e); }
}
analyzeStep2();
