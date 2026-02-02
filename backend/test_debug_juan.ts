
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

        console.log('Results Count:', res.recordset.length);
        if (res.recordset.length > 0) {
            const first = res.recordset[0];
            console.log('First OT ID:', first.idOT);
            console.log('idTecnicoAsignado value:', first.idTecnicoAsignado);
            console.log('idTecnicoAsignado type:', typeof first.idTecnicoAsignado);
        }

        const userRes = await pool.request()
            .query("SELECT idUsuario, nombre FROM Inv_seg_usuarios WHERE correo = 'juan.rodriguez@empresa.com'");
        console.log('User Data:', userRes.recordset[0]);
    } catch (err: any) {
        console.error('Error:', err.message);
    } finally {
        process.exit();
    }
}

test();
