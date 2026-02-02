
-- ========================================================
-- MIGRACIÓN InventarioCore: ELIMINACIÓN SEGURA DE PROYECTOS V4
-- Fecha: 2026-01-28
-- Corrección: Manejo de SolicitudesCambio, Jerarquía Dual (idPadre/idTareaPadre)
-- ========================================================

CREATE OR ALTER PROCEDURE [dbo].[sp_Proyecto_Eliminar_V2]
    @idProyecto INT,
    @forceCascade BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @fechaCreacion DATE;
    DECLARE @nombreProyecto NVARCHAR(200);
    
    SELECT @fechaCreacion = CAST(fechaCreacion AS DATE), @nombreProyecto = nombre 
    FROM Inv_ope_proyectos WHERE idProyecto = @idProyecto;

    IF @fechaCreacion IS NULL
    BEGIN
        -- Idempotente: si no existe, terminar con éxito
        RETURN;
    END

    -- Regla de Negocio: 
    -- 1. Si se creó hoy, se permite borrado completo (fue un error de captura).
    -- 2. Si es de días anteriores, solo se permite si no tiene tareas activas O si se fuerza la cascada.
    
    DECLARE @esHoy BIT = 0;
    IF @fechaCreacion = CAST(GETDATE() AS DATE) SET @esHoy = 1;

    IF @esHoy = 0 AND @forceCascade = 0
    BEGIN
        -- Verificar si tiene tareas activas
        IF EXISTS (SELECT 1 FROM Inv_ope_proyecto_tareas WHERE idProyecto = @idProyecto AND activo = 1)
        BEGIN
            RAISERROR('El proyecto "%s" tiene tareas activas y no fue creado el día de hoy. Borre las tareas primero o use forceCascade=1 para limpieza total.', 16, 1, @nombreProyecto);
            RETURN;
        END
    END

    BEGIN TRANSACTION;
    BEGIN TRY
        -- Obtener lista de tareas a eliminar
        DECLARE @tareas TABLE (idTarea INT);
        INSERT INTO @tareas (idTarea)
        SELECT idTarea FROM Inv_ope_proyecto_tareas WHERE idProyecto = @idProyecto;

        -- 1. Solicitudes de Cambio
        DELETE FROM Inv_ope_proyecto_solicitudes_cambio WHERE idTarea IN (SELECT idTarea FROM @tareas);

        -- 2. CheckinTareas
        DELETE FROM Inv_ope_checkin_tareas WHERE idTarea IN (SELECT idTarea FROM @tareas);

        -- 3. TareaAvances
        DELETE FROM Inv_ope_proyecto_tarea_avances WHERE idTarea IN (SELECT idTarea FROM @tareas);

        -- 4. Bloqueos
        DELETE FROM Inv_ope_proyecto_bloqueos WHERE idTarea IN (SELECT idTarea FROM @tareas);

        -- 5. TareaAsignados
        DELETE FROM Inv_ope_proyecto_tarea_asignados WHERE idTarea IN (SELECT idTarea FROM @tareas);

        -- 6. Recurrencia e Instancias
        DELETE FROM p_TareaInstancia WHERE idTarea IN (SELECT idTarea FROM @tareas);
        DELETE FROM p_TareaRecurrencia WHERE idTarea IN (SELECT idTarea FROM @tareas);

        -- 7. Romper jerarquía de tareas internas (ambas columnas legacy y nuevas)
        UPDATE Inv_ope_proyecto_tareas SET idTareaPadre = NULL, idPadre = NULL WHERE idProyecto = @idProyecto;

        -- 8. Tareas
        DELETE FROM Inv_ope_proyecto_tareas WHERE idProyecto = @idProyecto;

        -- 9. Finalmente, el Proyecto
        DELETE FROM Inv_ope_proyectos WHERE idProyecto = @idProyecto;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO



