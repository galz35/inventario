
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

        // 1. Create BODEGA role if not exists
        const checkRole = await sql.query("SELECT idRol FROM Inv_seg_roles WHERE nombre = 'BODEGA'");
        let bodegaId;
        if (checkRole.recordset.length === 0) {
            console.log("Creando rol BODEGA...");
            const insertRole = await sql.query("INSERT INTO Inv_seg_roles (nombre, fechaCreacion) OUTPUT INSERTED.idRol VALUES ('BODEGA', GETDATE())");
            bodegaId = insertRole.recordset[0].idRol;
        } else {
            bodegaId = checkRole.recordset[0].idRol;
        }

        // 2. Assign BODEGA role to Roberto
        console.log(`Asignando rol BODEGA (ID: ${bodegaId}) a Roberto Central...`);
        await sql.query(`UPDATE Inv_seg_usuarios SET idRol = ${bodegaId} WHERE correo = 'roberto.central@empresa.com'`);

        // 3. Rename "Despacho" to "SUPERVISOR" for clarity if desired, but let's stick to what we have or adjust.
        // User said "supervisor crear lo caso o proyecto", Sofia is "Despacho".

        console.log("✅ Roles actualizados correctamente.");

    } catch (e) {
        console.error(e);
    } finally {
        await sql.close();
    }
})();
