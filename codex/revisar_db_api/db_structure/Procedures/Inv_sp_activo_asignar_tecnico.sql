CREATE   PROCEDURE Inv_sp_activo_asignar_tecnico
    @idActivo INT,
    @idTecnico INT,
    @idUsuarioResponsable INT,
    @notas NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @almacenOrig INT, @almacenDest INT, @tecnicoOrig INT;

    -- Obtener estado actual
    SELECT @almacenOrig = idAlmacenActual, @tecnicoOrig = idTecnicoActual FROM Inv_act_activos WHERE idActivo = @idActivo;
    
    -- Obtener almacén del técnico destino
    SELECT @almacenDest = idAlmacenTecnico FROM Inv_seg_usuarios WHERE idUsuario = @idTecnico;

    BEGIN TRANSACTION
    BEGIN TRY
        -- 1. Actualizar estado del activo
        UPDATE Inv_act_activos 
        SET estado = 'ASIGNADO', 
            idTecnicoActual = @idTecnico, 
            idAlmacenActual = @almacenDest
        WHERE idActivo = @idActivo;

        -- 2. Registrar historial
        INSERT INTO Inv_act_movimientos (
            idActivo, tipoMovimiento, idUsuarioResponsable, 
            almacenAnteriorId, almacenNuevoId, 
            tecnicoAnteriorId, tecnicoNuevoId, notas
        )
        VALUES (
            @idActivo, 'ASIGNACION', @idUsuarioResponsable, 
            @almacenOrig, @almacenDest, 
            @tecnicoOrig, @idTecnico, @notas
        );

        COMMIT TRANSACTION
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO