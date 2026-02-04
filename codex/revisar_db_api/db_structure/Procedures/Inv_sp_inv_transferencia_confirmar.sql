CREATE   PROCEDURE Inv_sp_inv_transferencia_confirmar
    @idTransferencia INT,
    @idUsuarioRecibe INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @almacenDest INT;
    SELECT @almacenDest = almacenDestinoId FROM Inv_inv_transferencias WHERE idTransferencia = @idTransferencia;

    BEGIN TRANSACTION
    BEGIN TRY
        -- 1. Actualizar Cabecera
        UPDATE Inv_inv_transferencias 
        SET estado = 'COMPLETADA', 
            idUsuarioRecibe = @idUsuarioRecibe, 
            fechaRecepcion = GETDATE()
        WHERE idTransferencia = @idTransferencia;

        -- 2. Procesar cada ítem del detalle para sumarlo al stock destino
        DECLARE @prodId INT, @cant DECIMAL(18,2);
        DECLARE cur CURSOR FOR SELECT productoId, cantidadEnviada FROM Inv_inv_transferencia_detalle WHERE idTransferencia = @idTransferencia;
        OPEN cur;
        FETCH NEXT FROM cur INTO @prodId, @cant;
        WHILE @@FETCH_STATUS = 0
        BEGIN
            -- Registrar Movimiento de Entrada (Kardex)
            DECLARE @idMov INT;
            INSERT INTO Inv_inv_movimientos (tipoMovimiento, almacenDestinoId, idUsuarioResponsable, referenciaTexto, fechaMovimiento, estado)
            VALUES ('RECUERACION_TRANSFERENCIA', @almacenDest, @idUsuarioRecibe, 'Recibo TR #' + CAST(@idTransferencia AS NVARCHAR(10)), GETDATE(), 'APLICADO');
            SET @idMov = SCOPE_IDENTITY();

            -- Asegurar que existe registro de stock
            IF NOT EXISTS (SELECT 1 FROM Inv_inv_stock WHERE almacenId = @almacenDest AND productoId = @prodId)
                INSERT INTO Inv_inv_stock (almacenId, productoId, cantidad) VALUES (@almacenDest, @prodId, 0);

            -- Sumar Stock
            UPDATE Inv_inv_stock SET cantidad = cantidad + @cant WHERE almacenId = @almacenDest AND productoId = @prodId;
            
            -- Detalle Movimiento
            INSERT INTO Inv_inv_movimiento_detalle (idMovimiento, productoId, cantidad, stockAnterior, stockNuevo)
            SELECT @idMov, @prodId, @cant, cantidad - @cant, cantidad FROM Inv_inv_stock WHERE almacenId = @almacenDest AND productoId = @prodId;

            UPDATE Inv_inv_transferencia_detalle SET cantidadRecibida = @cant WHERE idTransferencia = @idTransferencia AND productoId = @prodId;

            FETCH NEXT FROM cur INTO @prodId, @cant;
        END
        CLOSE cur;
        DEALLOCATE cur;

        COMMIT TRANSACTION
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO