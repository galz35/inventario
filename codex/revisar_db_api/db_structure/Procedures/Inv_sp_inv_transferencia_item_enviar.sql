CREATE   PROCEDURE Inv_sp_inv_transferencia_item_enviar
    @idTransferencia INT,
    @productoId INT,
    @cantidad DECIMAL(18,2)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @almacenOrig INT, @idUsuario INT;
    SELECT @almacenOrig = almacenOrigenId, @idUsuario = idUsuarioEnvia FROM Inv_inv_transferencias WHERE idTransferencia = @idTransferencia;

    -- 1. Registrar Detalle de Transferencia
    INSERT INTO Inv_inv_transferencia_detalle (idTransferencia, productoId, cantidadEnviada)
    VALUES (@idTransferencia, @productoId, @cantidad);

    -- 2. Registrar Movimiento de Salida (Kardex)
    DECLARE @idMov INT;
    
    -- Crear Movimiento de Salida
    INSERT INTO Inv_inv_movimientos (tipoMovimiento, almacenOrigenId, idUsuarioResponsable, referenciaTexto, fechaMovimiento, estado)
    VALUES ('ENVIO_TRANSFERENCIA', @almacenOrig, @idUsuario, 'Envío TR #' + CAST(@idTransferencia AS NVARCHAR(10)), GETDATE(), 'APLICADO');
    SET @idMov = SCOPE_IDENTITY();

    -- Restar Stock y crear detalle movimiento
    UPDATE Inv_inv_stock SET cantidad = cantidad - @cantidad WHERE almacenId = @almacenOrig AND productoId = @productoId;
    
    INSERT INTO Inv_inv_movimiento_detalle (idMovimiento, productoId, cantidad, stockAnterior, stockNuevo)
    SELECT @idMov, @productoId, -@cantidad, cantidad + @cantidad, cantidad FROM Inv_inv_stock WHERE almacenId = @almacenOrig AND productoId = @productoId;
END
GO