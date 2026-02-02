
const bcrypt = require('bcrypt');
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

const USERS = [
    // ADMINS
    { nombre: 'Diana Martinez', email: 'diana.martinez@empresa.com', rol: 'ADMIN' },
    { nombre: 'Mario Estrada', email: 'mario.estrada@empresa.com', rol: 'ADMIN' },

    // SUPERVISORES
    { nombre: 'Sofia Lopez', email: 'sofia.lopez@empresa.com', rol: 'SUPERVISOR' },
    { nombre: 'Marcos Venegas', email: 'marcos.venegas@empresa.com', rol: 'SUPERVISOR' },
    { nombre: 'Raul Castro', email: 'raul.castro@empresa.com', rol: 'DESPACHO' },

    // BODEGUEROS
    { nombre: 'Roberto Central', email: 'roberto.central@empresa.com', rol: 'BODEGUERO' },

    // TECNICOS
    { nombre: 'Carlos Paredes', email: 'carlos.paredes@empresa.com', rol: 'TECNICO' },

    // AUDITORES
    { nombre: 'Elena Rojas', email: 'elena.rojas@empresa.com', rol: 'AUDITOR' }
];

(async () => {
    try {
        console.log('Generando hash para 123456...');
        const hash = await bcrypt.hash('123456', 10);
        console.log('Hash generado:', hash);

        await sql.connect(config);

        for (const u of USERS) {
            console.log(`Procesando usuario: ${u.email}`);

            // Upsert usuario
            const query = `
                IF NOT EXISTS (SELECT * FROM Inv_seg_usuarios WHERE correo = '${u.email}')
                BEGIN
                    INSERT INTO Inv_seg_usuarios (nombre, correo, password, activo, fechaCreacion, rolNombre)
                    VALUES ('${u.nombre}', '${u.email}', '${hash}', 1, GETDATE(), '${u.rol}')
                END
                ELSE
                BEGIN
                    UPDATE Inv_seg_usuarios 
                    SET password = '${hash}', rolNombre = '${u.rol}', activo = 1
                    WHERE correo = '${u.email}'
                END
            `;
            await sql.query(query);
        }

        console.log('Usuarios creados/actualizados correctamente.');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await sql.close();
    }
})();
