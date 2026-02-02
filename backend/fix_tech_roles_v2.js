
const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER || 'plan',
    password: process.env.DB_PASSWORD || 'admin123',
    server: process.env.DB_HOST || '54.146.235.205',
    database: process.env.DB_NAME || 'inventario',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

(async () => {
    try {
        await sql.connect(config);

        console.log("🔄 Corrigiendo roles de técnicos...");

        const TECH_EMAILS = [
            'carlos.paredes@empresa.com',
            'juan.rodriguez@empresa.com',
            'miguel.torres@empresa.com',
            'andrea.rivas@empresa.com'
        ];

        for (const email of TECH_EMAILS) {
            await sql.query(`UPDATE Inv_seg_usuarios SET idRol = 3 WHERE correo = '${email}'`);
            console.log(`   ✅ Rol actualizado para ${email}`);
        }

        console.log("\n✅ Listo. Todos los técnicos ahora tienen idRol = 3.");

        // List workloads again
        const result = await sql.query(`
            SELECT u.nombre, u.correo, COUNT(o.idOT) as total_ots
            FROM Inv_seg_usuarios u
            JOIN Inv_ope_ot o ON u.idUsuario = o.idTecnicoAsignado
            WHERE u.idRol = 3
            GROUP BY u.nombre, u.correo
        `);
        console.log("\n📊 Carga de trabajo verificada:");
        console.table(result.recordset);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await sql.close();
    }
})();
