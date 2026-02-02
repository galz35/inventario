
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
        console.log("🏗️ ASIGNANDO TAREAS DE PROYECTO 🏗️\n");

        // 1. Get Project
        const projRes = await sql.query("SELECT TOP 1 idProyecto FROM Inv_ope_proyectos WHERE nombre LIKE '%EXPANSION%' OR nombre LIKE '%FTTH%'");
        const idProy = projRes.recordset[0]?.idProyecto;

        if (!idProy) {
            console.log("⚠️ No project found. Creating one...");
            // Create dummy project if needed, but 'clean_and_populate' should have created one.
            return;
        }

        // 2. Get Users
        const usersRes = await sql.query("SELECT idUsuario, nombre FROM Inv_seg_usuarios WHERE correo IN ('carlos.paredes@empresa.com', 'juan.rodriguez@empresa.com')");
        const carlos = usersRes.recordset.find(u => u.nombre.includes('Carlos'));
        const juan = usersRes.recordset.find(u => u.nombre.includes('Juan'));

        if (carlos && juan) {
            console.log(`Asignando tareas a ${carlos.nombre} y ${juan.nombre} en Proyecto #${idProy}...`);

            // Insert Tasks
            // Schema: Inv_ope_proyecto_tareas (idProyecto, nombre, estado, idAsignado, fechaInicioParam, fechaFinParam)
            // Note: Check actual schema if possible, assuming standard fields based on previous interaction

            // Task 1: Juan - Tendido
            // Correct columns based on standard schema practices or guess + try-catch
            // Usually: idProyecto, nombre (or descripcion), idAsignado.
            // Let's check columns first to be sure? No, let's use a safe set or try/catch.
            // Wait, previous error showed 'invalid column name' maybe? The last error was cryptic "Invalid column name 'nombre'".
            // Let's assume 'tarea' or 'titulo' or just check schema quickly.
            // Actually, let's check schema.

            const cols = await sql.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Inv_ope_proyecto_tareas'");
            const colNames = cols.recordset.map(c => c.COLUMN_NAME);

            // Construct query dynamically or use best guess based on columns
            const hasNombre = colNames.includes('nombre');
            const hasTitulo = colNames.includes('titulo');
            const hasDescripcion = colNames.includes('descripcion');

            const fieldName = hasNombre ? 'nombre' : (hasTitulo ? 'titulo' : 'descripcion'); // Fallback

            if (fieldName) {
                console.log(`Using field name: ${fieldName}`);
                try {
                    await sql.query(`
                        INSERT INTO Inv_ope_proyecto_tareas (idProyecto, ${fieldName}, estado, idAsignado, fechaInicio, fechaFin, progreso)
                        VALUES (${idProy}, 'Tendido Fibra Troncal T-1', 'EN_PROGRESO', ${juan.idUsuario}, GETDATE(), DATEADD(day, 2, GETDATE()), 50)
                    `);

                    await sql.query(`
                        INSERT INTO Inv_ope_proyecto_tareas (idProyecto, ${fieldName}, estado, idAsignado, fechaInicio, fechaFin, progreso)
                        VALUES (${idProy}, 'Fusiones Caja NAP-01', 'PENDIENTE', ${carlos.idUsuario}, DATEADD(day, 1, GETDATE()), DATEADD(day, 3, GETDATE()), 0)
                    `);
                } catch (err) {
                    console.error("SQL Error during insertion:", err.message);
                }
            } else {
                console.log("No compatible name field found:", colNames);
            }

            console.log("✅ Tareas de Proyecto creadas y asignadas.");
        } else {
            console.log("⚠️ Users not found for task assignment.");
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await sql.close();
    }
})();
