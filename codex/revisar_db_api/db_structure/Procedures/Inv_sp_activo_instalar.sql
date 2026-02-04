CREATE   PROCEDURE Inv_sp_activo_instalar
    @idActivo INT,
    @idCliente INT,
    @idOT INT,
    @idUsuarioResponsable INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @almacenOrig INT, @tecnicoOrig INT;

    SELECT @almacenOrig = idAlmacenActual, @tecnicoOrig = idTecnicoActual FROM Inv_act_activos WHERE idActivo = @idActivo;

    BEGIN TRANSACTION
    BEGIN TRY
        -- 1. Actualizar activo
        UPDATE Inv_act_activos 
        SET estado = 'INSTALADO', 
            idAlmacenActual = NULL, 
            idTecnicoActual = NULL, 
            idClienteActual = @idCliente
        WHERE idActivo = @idActivo;

        -- 2. Registrar en la OT el activo instalado
        -- Nota: Esta tabla debe existir en el esquema de OPE
        IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Inv_ope_ot_activos')
        BEGIN
             CREATE TABLE Inv_ope_ot_activos (
                id INT IDENTITY(1,1) PRIMARY KEY,
                idOT INT NOT NULL REFERENCES Inv_ope_ot(idOT),
                idActivo INT NOT NULL REFERENCES Inv_act_activos(idActivo),
                tipoAccion NVARCHAR(20), -- INSTALADO, RETIRADO
                fecha DATETIME DEFAULT GETDATE()
             );
        END

        INSERT INTO Inv_ope_ot_activos (idOT, idActivo, tipoAccion)
        VALUES (@idOT, @idActivo, 'INSTALADO');

        -- 3. Historial del activo
        INSERT INTO Inv_act_movimientos (idActivo, tipoMovimiento, idUsuarioResponsable, almacenAnteriorId, tecnicoAnteriorId, notas)
        VALUES (@idActivo, 'INSTALACION', @idUsuarioResponsable, @almacenOrig, @tecnicoOrig, 'Instalado vía OT #' + CAST(@idOT AS NVARCHAR(10)));

        COMMIT TRANSACTION
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO