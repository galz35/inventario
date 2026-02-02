
const sql = require('mssql');
const bcrypt = require('bcrypt');
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

const NEW_TECHS = [
    { nombre: 'Juan Rodriguez', correo: 'juan.rodriguez@empresa.com', carnet: 'T002' },
    { nombre: 'Miguel Torres', correo: 'miguel.torres@empresa.com', carnet: 'T003' },
    { nombre: 'Andrea Rivas', correo: 'andrea.rivas@empresa.com', carnet: 'T004' }
];

(async () => {
    try {
        await sql.connect(config);
        const salt = await bcrypt.genSalt(10);
        const hashedPw = await bcrypt.hash('123456', salt);

        // Find Role ID for TECNICO
        const roleRes = await sql.query("SELECT idRol FROM Inv_seg_roles WHERE nombre = 'TECNICO' OR nombre = 'Técnico'");
        const idRol = roleRes.recordset[0]?.idRol || 4; // Fallback to 4 based on previous logs

        for (const tech of NEW_TECHS) {
            // Check if exists
            const check = await sql.query(`SELECT idUsuario FROM Inv_seg_usuarios WHERE correo = '${tech.correo}'`);

            if (check.recordset.length === 0) {
                console.log(`Creando técnico: ${tech.nombre}...`);
                await sql.query(`
                    INSERT INTO Inv_seg_usuarios (nombre, correo, carnet, password, idRol, activo, fechaCreacion)
                    VALUES ('${tech.nombre}', '${tech.correo}', '${tech.carnet}', '${hashedPw}', ${idRol}, 1, GETDATE())
                `);
            } else {
                console.log(`Técnico ${tech.nombre} ya existe.`);
            }
        }

        // --- ASIGNAR CARGA DE TRABAJO ---
        console.log("\n📦 Asignando carga de trabajo simulada...");

        // Get technical IDs
        const users = await sql.query("SELECT idUsuario, nombre FROM Inv_seg_usuarios WHERE correo LIKE '%@empresa.com'");
        const techList = users.recordset;

        // Create some OTs for these techs
        for (const tech of techList) {
            // Check if they already have OTs
            const otCheck = await sql.query(`SELECT count(*) as total FROM Inv_ope_ot WHERE idTecnicoAsignado = ${tech.idUsuario}`);
            if (otCheck.recordset[0].total < 2) {
                console.log(`   Asignando 2 OTs a ${tech.nombre}...`);
                await sql.query(`
                    INSERT INTO Inv_ope_ot (clienteNombre, clienteDireccion, tipoOT, prioridad, estado, idTecnicoAsignado, fechaAsignacion, notas)
                    VALUES 
                    ('Cliente Simulado A', 'Calle 123', 'INSTALACION', 'MEDIA', 'PENDIENTE', ${tech.idUsuario}, GETDATE(), 'Tarea de prueba 1'),
                    ('Cliente Simulado B', 'Av. Central', 'MANTENIMIENTO', 'BAJA', 'EN_PROGRESO', ${tech.idUsuario}, GETDATE(), 'Tarea de prueba 2')
                `);
            }
        }

        console.log("\n✅ Técnicos y carga listos.");
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await sql.close();
    }
})();
