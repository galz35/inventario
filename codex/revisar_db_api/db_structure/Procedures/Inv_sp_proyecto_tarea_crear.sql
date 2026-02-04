
            CREATE   PROCEDURE Inv_sp_proyecto_tarea_crear
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
        
GO