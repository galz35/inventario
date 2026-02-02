
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

        console.log("🔍 VERIFICACIÓN DE KARDEX Y OT (ESCENARIO DEMO) 🔍\n");

        // 1. Check OT
        const ots = await sql.query(`
            SELECT TOP 1 idOT, cliente, estado, idTecnicoAsignado, fechaCreacion 
            FROM Inv_ope_ot 
            ORDER BY idOT DESC
        `);
        console.log("📋 ÚLTIMA OT CREADA:");
        console.table(ots.recordset);
        const idOT = ots.recordset[0]?.idOT;

        if (idOT) {
            // 2. Check Consumption (Movements linked to OT)
            console.log(`\n📦 MOVIMIENTOS DE INVENTARIO (KARDEX) PARA OT #${idOT}:`);
            const movs = await sql.query(`
                SELECT 
                    m.idMovimiento, 
                    m.tipo, 
                    m.fecha, 
                    p.codigo, 
                    p.nombre as producto, 
                    d.cantidad, 
                    u.nombre as responsable,
                    a.nombre as almacen
                FROM Inv_inv_movimientos m
                JOIN Inv_inv_movimiento_detalle d ON m.idMovimiento = d.idMovimiento
                JOIN Inv_cat_productos p ON d.idProducto = p.idProducto
                JOIN Inv_seg_usuarios u ON m.idUsuario = u.idUsuario
                JOIN Inv_cat_almacenes a ON m.idAlmacen = a.idAlmacen
                WHERE m.referenciaId = '${idOT}' AND m.referenciaTipo = 'OT'
            `);
            console.table(movs.recordset);
        }

        // 3. Check Technician Stock (Almacen Movil)
        console.log("\n🚛 STOCK ACTUAL EN ALMACÉN MÓVIL (TÉCNICO):");
        const stock = await sql.query(`
            SELECT a.nombre as almacen, p.codigo, s.cantidad 
            FROM Inv_inv_stock s
            JOIN Inv_cat_almacenes a ON s.almacenId = a.idAlmacen
            JOIN Inv_cat_productos p ON s.productoId = p.idProducto
            WHERE a.tipo = 'MOVIL' AND p.codigo IN ('CBL-FIB-1H', 'SPL-1-8')
        `);
        console.table(stock.recordset);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await sql.close();
    }
})();
