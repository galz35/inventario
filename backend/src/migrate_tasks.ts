
require('dotenv').config();
import { ejecutarQuery } from './db/base.repo';

async function migrateData() {
    console.log('Migrating data from Inv_ope_proyecto_tareas to Inv_ope_tareas...');
    try {
        // Check if old table exists
        const checkOld = await ejecutarQuery("SELECT * FROM sys.tables WHERE name = 'Inv_ope_proyecto_tareas'");
        if (checkOld.length === 0) {
            console.log('Old table Inv_ope_proyecto_tareas does not exist. Skipping migration.');
            return;
        }

        // Migrate data
        // We use IDENTITY_INSERT to preserve IDs
        await ejecutarQuery(`
            SET IDENTITY_INSERT Inv_ope_tareas ON;
            
            INSERT INTO Inv_ope_tareas (idTarea, idProyecto, idTareaPadre, nombre, descripcion, fechaInicioPrevista, fechaFinPrevista, estado, orden, fechaCreacion)
            SELECT idTarea, idProyecto, idTareaPadre, nombre, descripcion, fechaInicioPrevista, fechaFinPrevista, estado, orden, GETDATE()
            FROM Inv_ope_proyecto_tareas
            WHERE idTarea NOT IN (SELECT idTarea FROM Inv_ope_tareas);
            
            SET IDENTITY_INSERT Inv_ope_tareas OFF;
        `);
        console.log('Data migration complete.');

        // Now update SPs
        // We can't easily run the full .sql file from here as it might contain GO statements which mssql driver doesn't like.
        // We will define the SPs here directly.

        console.log('Updating Inv_sp_proyecto_wbs_obtener...');
        await ejecutarQuery(`
            CREATE OR ALTER PROCEDURE Inv_sp_proyecto_wbs_obtener
                @idProyecto INT
            AS
            BEGIN
                SET NOCOUNT ON;
                SELECT 
                    t.idTarea,
                    t.idProyecto,
                    t.idTareaPadre,
                    t.nombre,
                    t.descripcion,
                    t.fechaInicioPrevista,
                    t.fechaFinPrevista,
                    t.estado,
                    (SELECT COUNT(*) FROM Inv_ope_tareas sub WHERE sub.idTareaPadre = t.idTarea) as hasChildren
                FROM Inv_ope_tareas t
                WHERE t.idProyecto = @idProyecto
                ORDER BY t.idTareaPadre, t.orden, t.idTarea;
            END
        `);

        console.log('Updating Inv_sp_proyecto_tarea_crear...');
        await ejecutarQuery(`
            CREATE OR ALTER PROCEDURE Inv_sp_proyecto_tarea_crear
                @idProyecto INT,
                @idTareaPadre INT = NULL,
                @nombre NVARCHAR(255),
                @descripcion NVARCHAR(MAX) = NULL,
                @fechaInicio DATETIME = NULL,
                @fechaFin DATETIME = NULL
            AS
            BEGIN
                SET NOCOUNT ON;
                INSERT INTO Inv_ope_tareas (idProyecto, idTareaPadre, nombre, descripcion, fechaInicioPrevista, fechaFinPrevista)
                VALUES (@idProyecto, @idTareaPadre, @nombre, @descripcion, @fechaInicio, @fechaFin);
                
                SELECT SCOPE_IDENTITY() AS idTarea;
            END
        `);

        // Also fix the assignments logic
        // We need to ensure Inv_ope_tarea_asignaciones has data if Inv_ope_proyecto_tarea_asignados had data
        // But the previous error said Inv_ope_proyecto_tarea_asignados invalid object name, so maybe assignment table was missing?
        // Wait, earlier log: "Invalid object name 'Inv_ope_proyecto_tarea_asignados'"
        // So assignments probably were lost or never existed properly in the old schema.
        // We already created Inv_ope_tarea_asignaciones.

        console.log('All updates applied successfully.');

    } catch (error) {
        console.error('Error migrating data:', error);
    }
}
migrateData();
