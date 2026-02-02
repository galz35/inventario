
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

        console.log("🛠️ ASIGNANDO HERRAMIENTAS Y ACTIVOS (SQL DIRECTO) 🛠️\n");

        // 1. Asignar Fusionadora a Carlos
        // Buscar Activo por Serial aproximado o crear si no existe
        const serialFus = 'FUS-S72C-889';

        // Find Carlos ID
        const techRes = await sql.query("SELECT idUsuario FROM Inv_seg_usuarios WHERE correo='carlos.paredes@empresa.com'");
        const idCarlos = techRes.recordset[0]?.idUsuario;

        if (idCarlos) {
            // Check if asset exists
            const check = await sql.query(`SELECT idActivo FROM Inv_act_activos WHERE serial='${serialFus}'`);
            if (check.recordset.length > 0) {
                // Update
                await sql.query(`
                    UPDATE Inv_act_activos 
                    SET idTecnicoActual = ${idCarlos}, estado = 'ASIGNADO', idAlmacenActual = NULL
                    WHERE serial = '${serialFus}'
                 `);
                console.log(`✅ FUSIONADORA (${serialFus}) asignada a Carlos.`);
            } else {
                // Insert one for demo
                // Need a Product ID for "Fusionadora"
                const prod = await sql.query("SELECT TOP 1 idProducto FROM Inv_cat_productos WHERE nombre LIKE '%Fusionadora%'");
                const idProd = prod.recordset[0]?.idProducto;
                if (idProd) {
                    await sql.query(`
                        INSERT INTO Inv_act_activos (serial, idProducto, estado, idTecnicoActual, fechaIngreso, notas)
                        VALUES ('${serialFus}', ${idProd}, 'ASIGNADO', ${idCarlos}, GETDATE(), 'Asignada para Demo')
                    `);
                    console.log(`✅ Fusionadora Creada y Asignada a Carlos.`);
                }
            }
        }

        // 2. Asignar Activo Fijo (Camioneta) a Proyecto (Simulado via Notas o Asignación a Responsable de Proyecto?)
        // User asked: "como dice que equipo activo fijo ocupara en proyecto"
        // Usually assets are linked to a Responsible Person, and that Person works on a Project.
        // Or specific module "Recursos de Proyecto".
        // Let's assign a Pickup to "Marcos Venegas" (Supervisor Proyecto)
        const supRes = await sql.query("SELECT idUsuario FROM Inv_seg_usuarios WHERE correo='marcos.venegas@empresa.com'");
        const idMarcos = supRes.recordset[0]?.idUsuario;

        if (idMarcos) {
            const placa = 'M-123456';
            // Find or Create Pickup
            const checkP = await sql.query(`SELECT idActivo FROM Inv_act_activos WHERE serial='${placa}'`);
            if (checkP.recordset.length === 0) {
                const prodP = await sql.query("SELECT TOP 1 idProducto FROM Inv_cat_productos WHERE nombre LIKE '%Camioneta%' OR nombre LIKE '%Pickup%'");
                const idProdP = prodP.recordset[0]?.idProducto;
                if (idProdP) {
                    await sql.query(`
                        INSERT INTO Inv_act_activos (serial, idProducto, estado, idTecnicoActual, fechaIngreso, notas)
                        VALUES ('${placa}', ${idProdP}, 'ASIGNADO', ${idMarcos}, GETDATE(), 'Asignada a Supervisor Proyecto')
                    `);
                    console.log(`✅ Camioneta (${placa}) asignada a Marcos (Supervisor).`);
                }
            }
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await sql.close();
    }
})();
