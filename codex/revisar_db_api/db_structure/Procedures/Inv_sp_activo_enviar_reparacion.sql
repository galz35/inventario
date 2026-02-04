CREATE   PROCEDURE Inv_sp_activo_enviar_reparacion
    @idActivo INT,
    @diagnostico NVARCHAR(MAX),
    @idUsuario INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @almacenOrig INT;
    SELECT @almacenOrig = idAlmacenActual FROM Inv_act_activos WHERE idActivo = @idActivo;

    BEGIN TRANSACTION
    BEGIN TRY
        -- 1. Actualizar Activo
        UPDATE Inv_act_activos 
        SET estado = 'REPARACION'
        WHERE idActivo = @idActivo;

        -- 2. Registrar en Reparaciones
        INSERT INTO Inv_act_reparaciones (idActivo, diagnostico, enviadoPor, fechaEnvio)
        VALUES (@idActivo, @diagnostico, @idUsuario, GETDATE());

        -- 3. Historial
        INSERT INTO Inv_act_movimientos (idActivo, tipoMovimiento, idUsuarioResponsable, almacenAnteriorId, notas)
        VALUES (@idActivo, 'REPARACION', @idUsuario, @almacenOrig, @diagnostico);

        COMMIT TRANSACTION
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO