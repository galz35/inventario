
const { obtenerPoolSql } from './src/db/sqlserver.provider';
const sql = require('mssql');

async function test() {
    try {
        const pool = await obtenerPoolSql();
        const res = await pool.request()
            .input('idTecnico', sql.Int, 202)
            .execute('Inv_sp_ot_listar_tecnico');
        console.log('Result for user 202:');
        console.log(JSON.stringify(res.recordset, null, 2));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

test();
