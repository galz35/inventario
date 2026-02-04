CREATE   PROCEDURE Inv_sp_inv_stock_ajustar
    @almacenId INT,
    @productoId INT,
    @nuevaCantidad DECIMAL(18,2),
    @motivo NVARCHAR(MAX),
    @idUsuario INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @cantAnt DECIMAL(18,2);
    SELECT @cantAnt = ISNULL(cantidad, 0) FROM Inv_inv_stock WITH (UPDLOCK) WHERE almacenId = @almacenId AND productoId = @productoId;

    BEGIN TRANSACTION
    BEGIN TRY
        -- 1. Actualizar/Insertar Stock
        IF EXISTS (SELECT 1 FROM Inv_inv_stock WHERE almacenId = @almacenId AND productoId = @productoId)
            UPDATE Inv_inv_stock SET cantidad = @nuevaCantidad WHERE almacenId = @almacenId AND productoId = @productoId;
        ELSE
            INSERT INTO Inv_inv_stock (almacenId, productoId, cantidad) VALUES (@almacenId, @productoId, @nuevaCantidad);

        -- 2. Registrar Ajuste
        INSERT INTO Inv_inv_ajustes (almacenId, productoId, cantidadAnterior, cantidadNueva, motivo, idUsuario)
        VALUES (@almacenId, @productoId, @cantAnt, @nuevaCantidad, @motivo, @idUsuario);

        -- 3. Registrar Movimiento (Kardex)
        DECLARE @idMov INT;
        INSERT INTO Inv_inv_movimientos (tipoMovimiento, almacenOrigenId, idUsuarioResponsable, notas, referenciaTexto)
        VALUES ('AJUSTE_MANUAL', @almacenId, @idUsuario, @motivo, 'Ajuste Manual');
        SET @idMov = SCOPE_IDENTITY();

        INSERT INTO Inv_inv_movimiento_detalle (idMovimiento, productoId, cantidad, stockAnterior, stockNuevo)
        VALUES (@idMov, @productoId, @nuevaCantidad - @cantAnt, @cantAnt, @nuevaCantidad);

        COMMIT TRANSACTION
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO