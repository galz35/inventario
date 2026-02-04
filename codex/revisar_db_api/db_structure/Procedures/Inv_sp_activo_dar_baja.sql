CREATE   PROCEDURE Inv_sp_activo_dar_baja
    @idActivo INT,
    @idUsuario INT,
    @motivo NVARCHAR(MAX)
AS
BEGIN
    BEGIN TRANSACTION
    BEGIN TRY
        UPDATE Inv_act_activos 
        SET estado = 'BAJA', 
            idAlmacenActual = NULL, 
            idTecnicoActual = NULL 
        WHERE idActivo = @idActivo;

        INSERT INTO Inv_act_movimientos (idActivo, tipoMovimiento, idUsuarioResponsable, notas)
        VALUES (@idActivo, 'BAJA_DEFINITIVA', @idUsuario, @motivo);

        COMMIT TRANSACTION
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO