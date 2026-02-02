
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

        const techs = await sql.query("SELECT idUsuario, nombre FROM Inv_seg_usuarios WHERE idRol = 3");

        for (const tech of techs.recordset) {
            const almName = `Móvil - ${tech.nombre}`;

            // Check if exists
            const checkAlm = await sql.query(`SELECT idAlmacen FROM Inv_cat_almacenes WHERE nombre = '${almName}'`);
            let idAlmacen;

            if (checkAlm.recordset.length === 0) {
                console.log(`Creando almacén para ${tech.nombre}...`);
                const res = await sql.query(`
                    INSERT INTO Inv_cat_almacenes (nombre, tipo, responsableId, activo, fechaCreacion)
                    OUTPUT INSERTED.idAlmacen
                    VALUES ('${almName}', 'TECNICO', ${tech.idUsuario}, 1, GETDATE())
                `);
                idAlmacen = res.recordset[0].idAlmacen;
            } else {
                idAlmacen = checkAlm.recordset[0].idAlmacen;
            }

            // Assign to user
            await sql.query(`UPDATE Inv_seg_usuarios SET idAlmacenTecnico = ${idAlmacen} WHERE idUsuario = ${tech.idUsuario}`);
            console.log(`✅ ${tech.nombre} -> Almacén ID ${idAlmacen}`);
        }

        console.log("\n🚀 Todos los técnicos tienen ahora su propio almacén móvil.");

    } catch (e) {
        console.error(e);
    } finally {
        await sql.close();
    }
})();
