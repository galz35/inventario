
require('dotenv').config();
import { ejecutarQuery } from './db/base.repo';

async function runFix() {
    console.log('Running schema fix...');
    try {
        console.log('Checking Inv_ope_proyectos...');
        await ejecutarQuery(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Inv_ope_proyectos')
            BEGIN
                PRINT 'Creating Inv_ope_proyectos...';
                CREATE TABLE Inv_ope_proyectos (
                    idProyecto INT IDENTITY(1,1) PRIMARY KEY,
                    nombre NVARCHAR(255) NOT NULL,
                    descripcion NVARCHAR(MAX) NULL,
                    idResponsable INT NULL,
                    fechaInicio DATETIME NULL,
                    fechaFin DATETIME NULL,
                    estado NVARCHAR(50) DEFAULT 'ACTIVO',
                    fechaCreacion DATETIME DEFAULT GETDATE()
                );
            END
        `);

        console.log('Checking Inv_ope_tareas...');
        await ejecutarQuery(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Inv_ope_tareas')
            BEGIN
                PRINT 'Creating Inv_ope_tareas...';
                CREATE TABLE Inv_ope_tareas (
                    idTarea INT IDENTITY(1,1) PRIMARY KEY,
                    idProyecto INT NOT NULL,
                    idTareaPadre INT NULL,
                    nombre NVARCHAR(255) NOT NULL,
                    descripcion NVARCHAR(MAX) NULL,
                    fechaInicioPrevista DATETIME NULL,
                    fechaFinPrevista DATETIME NULL,
                    estado NVARCHAR(50) DEFAULT 'PENDIENTE',
                    orden INT DEFAULT 0,
                    fechaCreacion DATETIME DEFAULT GETDATE(),
                    FOREIGN KEY (idProyecto) REFERENCES Inv_ope_proyectos(idProyecto)
                );
            END
        `);

        console.log('Checking Inv_ope_tarea_asignaciones...');
        await ejecutarQuery(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Inv_ope_tarea_asignaciones')
            BEGIN
                PRINT 'Creating Inv_ope_tarea_asignaciones...';
                CREATE TABLE Inv_ope_tarea_asignaciones (
                    idAsignacion INT IDENTITY(1,1) PRIMARY KEY,
                    idTarea INT NOT NULL,
                    idUsuario INT NOT NULL,
                    carnet NVARCHAR(50) NULL,
                    tipo NVARCHAR(50) DEFAULT 'Responsable', 
                    esReasignacion BIT DEFAULT 0,
                    fechaAsignacion DATETIME DEFAULT GETDATE(),
                    FOREIGN KEY (idTarea) REFERENCES Inv_ope_tareas(idTarea)
                );
                PRINT '✅ Tabla Inv_ope_tarea_asignaciones creada.';
            END
        `);
        console.log('Fix executed successfully.');
    } catch (error) {
        console.error('Error executing fix:', error);
    }
}
runFix();
