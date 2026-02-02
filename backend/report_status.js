
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

        console.log("📊 RESUMEN ACTUAL DE DATOS 📊\n");

        // 1. OTs por Técnico
        console.log("1️⃣  OTs POR TÉCNICO:");
        try {
            const ots = await sql.query(`
                SELECT u.nombre, COUNT(o.idOT) as total_ots
                FROM Inv_ope_ot o
                JOIN Inv_seg_usuarios u ON o.idTecnicoAsignado = u.idUsuario
                GROUP BY u.nombre
            `);
            console.dir(ots.recordset);
        } catch (e) { console.error("Error en OTs:", e.message); }

        // 2. Proyectos y Tareas
        console.log("\n2️⃣  PROYECTOS Y TAREAS:");
        try {
            const proj = await sql.query(`
                SELECT p.nombre as proyecto, COUNT(t.idTarea) as tareas
                FROM Inv_ope_proyectos p
                LEFT JOIN Inv_ope_proyecto_tareas t ON p.idProyecto = t.idProyecto
                GROUP BY p.nombre
            `);
            console.dir(proj.recordset);
        } catch (e) { console.error("Error en Proyectos:", e.message); }

        // 3. Inventario Consumido
        console.log("\n3️⃣  INVENTARIO CONSUMIDO EN OTs:");
        try {
            const consumos = await sql.query(`
                SELECT p.nombre, SUM(c.cantidad) as total_cant, p.unidad
                FROM Inv_ope_ot_consumo c
                JOIN Inv_cat_productos p ON c.idProducto = p.idProducto
                GROUP BY p.nombre, p.unidad
            `);
            console.dir(consumos.recordset);
        } catch (e) { console.error("Error en Consumos:", e.message); }

        // 4. Herramientas y Activos
        console.log("\n4️⃣  ESTADO DE ACTIVOS (HERRAMIENTAS/EQUIPOS):");
        try {
            const activos = await sql.query(`
                SELECT p.nombre, a.serial, a.estado, COALESCE(u.nombre, alm.nombre) as ubicacion
                FROM Inv_act_activos a
                JOIN Inv_cat_productos p ON a.idProducto = p.idProducto
                LEFT JOIN Inv_seg_usuarios u ON a.idTecnicoActual = u.idUsuario
                LEFT JOIN Inv_cat_almacenes alm ON a.idAlmacenActual = alm.idAlmacen
            `);
            console.dir(activos.recordset);
        } catch (e) { console.error("Error en Activos:", e.message); }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await sql.close();
    }
})();
