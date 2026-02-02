const sql = require('mssql');

const config = {
    user: 'plan',
    password: 'admin123',
    server: '54.146.235.205',
    database: 'Bdplaner',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

(async () => {
    try {
        await sql.connect(config);
        const results = {};

        results.proyectos = (await sql.query('SELECT COUNT(*) as count FROM Inv_ope_proyectos')).recordset[0].count;
        results.tareas = (await sql.query('SELECT COUNT(*) as count FROM Inv_ope_tareas')).recordset[0].count;
        results.estimaciones = (await sql.query('SELECT COUNT(*) as count FROM Inv_ope_estimaciones')).recordset[0].count;
        results.ots = (await sql.query('SELECT COUNT(*) as count FROM Inv_ope_ot')).recordset[0].count;
        results.productos = (await sql.query('SELECT COUNT(*) as count FROM Inv_cat_productos')).recordset[0].count;
        results.stock = (await sql.query('SELECT SUM(cantidad) as total FROM Inv_inv_stock')).recordset[0].total;
        results.almacenes = (await sql.query('SELECT COUNT(*) as count FROM Inv_cat_almacenes')).recordset[0].count;
        results.usuarios = (await sql.query('SELECT COUNT(*) as count FROM p_Usuarios')).recordset[0].count;
        results.movimientos = (await sql.query('SELECT COUNT(*) as count FROM Inv_inv_movimiento_header')).recordset[0].count;

        console.log('--- DB DATA SNAPSHOT ---');
        console.table(results);

        const sampleProyectos = await sql.query('SELECT TOP 3 idProyecto, nombre FROM Inv_ope_proyectos');
        console.log('Sample Proyectos:', sampleProyectos.recordset);

        const sampleProductos = await sql.query('SELECT TOP 3 idProducto, nombre, codigo FROM Inv_cat_productos');
        console.log('Sample Productos:', sampleProductos.recordset);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await sql.close();
    }
})();
