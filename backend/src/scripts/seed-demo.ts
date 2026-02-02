import * as dotenv from 'dotenv';
dotenv.config();
import { crearRequest, Int, NVarChar } from '../db/base.repo';
import * as bcrypt from 'bcrypt';

async function seedUsers() {
    console.log('🌱 Seeding Demo Users...');

    const users = [
        {
            nombre: 'Miguel Torres',
            correo: 'miguel.torres@empresa.com',
            carnet: 'ADMIN-001',
            rol: 1, // ADMINISTRADOR
            rolNombre: 'ADMINISTRADOR'
        },
        {
            nombre: 'Sofia Lopez',
            correo: 'sofia.lopez@empresa.com',
            carnet: 'SUP-002',
            rol: 2, // SUPERVISOR
            rolNombre: 'SUPERVISOR'
        },
        {
            nombre: 'Carlos Paredes',
            correo: 'carlos.paredes@empresa.com',
            carnet: 'TEC-003',
            rol: 3, // TECNICO
            rolNombre: 'TECNICO'
        },
        {
            nombre: 'Carlos Paredes (Short)',
            correo: 'c',
            carnet: 'TEC-SHORT',
            rol: 3, // TECNICO
            rolNombre: 'TECNICO'
        },
        {
            nombre: 'Roberto Central',
            correo: 'roberto.central@empresa.com',
            carnet: 'BOD-004',
            rol: 4, // BODEGA
            rolNombre: 'BODEGA'
        }
    ];

    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash('123456', salt);

    for (const u of users) {
        const req = await crearRequest();

        // Check if exists
        const check = await req
            .input('correoCheck', NVarChar, u.correo)
            .query('SELECT idUsuario FROM Inv_seg_usuarios WHERE correo = @correoCheck');

        if (check.recordset.length > 0) {
            console.log(`🔄 Updating ${u.nombre}...`);
            const updateReq = await crearRequest();
            await updateReq
                .input('id', Int, check.recordset[0].idUsuario)
                .input('pass', NVarChar, hash)
                .input('rol', Int, u.rol)
                .input('nombre', NVarChar, u.nombre)
                .input('carnet', NVarChar, u.carnet)
                .query(`
                    UPDATE Inv_seg_usuarios 
                    SET password = @pass, idRol = @rol, activo = 1, nombre = @nombre, carnet = @carnet
                    WHERE idUsuario = @id
                `);
        } else {
            console.log(`✨ Creating ${u.nombre}...`);
            const insertReq = await crearRequest();
            await insertReq
                .input('nombre', NVarChar, u.nombre)
                .input('correo', NVarChar, u.correo)
                .input('pass', NVarChar, hash)
                .input('rol', Int, u.rol)
                .input('carnet', NVarChar, u.carnet)
                .query(`
                    INSERT INTO Inv_seg_usuarios (nombre, correo, password, idRol, carnet, activo, ultimoAcceso)
                    VALUES (@nombre, @correo, @pass, @rol, @carnet, 1, GETDATE())
                `);
        }
    }

    console.log('✅ Users Seeded Successfully!');
    process.exit(0);
}

seedUsers().catch(err => {
    console.error(err);
    process.exit(1);
});
