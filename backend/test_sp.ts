
import { obtenerPoolSql } from './src/db/sqlserver.provider';
import * as sql from 'mssql';
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
    try {
        const pool = await obtenerPoolSql();
        const res = await pool.request()
            .input('idTecnico', sql.Int, 202)
            .execute('Inv_sp_ot_listar_tecnico');
        if (res.recordset.length > 0) {
            console.log('Keys in first object:', Object.keys(res.recordset[0]));
            console.log('Sample object:', JSON.stringify(res.recordset[0], null, 2));
        } else {
            console.log('No records found for user 202');
        }
    } catch (err: any) {
        console.error('Error:', err.message);
    } finally {
        process.exit();
    }
}

test();
