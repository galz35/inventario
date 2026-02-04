CREATE   PROCEDURE Inv_sp_inv_movimiento_procesar_item
    @idMovimiento INT,
    @productoId INT,
    @cantidad DECIMAL(18,2), -- Positiva para entradas, Negativa para salidas
    @propietarioTipo NVARCHAR(20) = 'EMPRESA',
    @proveedorId INT = 0,
    @costoUnitario DECIMAL(18,2) = 0
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @almacenOrig INT, @almacenDest INT, @tipoMov NVARCHAR(50);
    DECLARE @stockAntOrig DECIMAL(18,2) = 0, @stockAntDest DECIMAL(18,2) = 0;

    -- Obtener datos de la cabecera
    SELECT @almacenOrig = almacenOrigenId, @almacenDest = almacenDestinoId, @tipoMov = tipoMovimiento
    FROM Inv_inv_movimientos WHERE idMovimiento = @idMovimiento;

    -- 1. PROCESAR SALIDA (SI HAY ORIGEN)
    IF @almacenOrig IS NOT NULL
    BEGIN
        SELECT @stockAntOrig = ISNULL(cantidad, 0) FROM Inv_inv_stock WITH (UPDLOCK)
        WHERE almacenId = @almacenOrig AND productoId = @productoId AND propietarioTipo = @propietarioTipo AND proveedorId = @proveedorId;

        -- Actualizar Stock Origen
        UPDATE Inv_inv_stock SET cantidad = cantidad - ABS(@cantidad)
        WHERE almacenId = @almacenOrig AND productoId = @productoId AND propietarioTipo = @propietarioTipo AND proveedorId = @proveedorId;

        -- Registrar en detalle como salida
        INSERT INTO Inv_inv_movimiento_detalle (idMovimiento, productoId, propietarioTipo, proveedorId, cantidad, costoUnitario, stockAnterior, stockNuevo)
        VALUES (@idMovimiento, @productoId, @propietarioTipo, @proveedorId, -ABS(@cantidad), @costoUnitario, @stockAntOrig, @stockAntOrig - ABS(@cantidad));
    END

    -- 2. PROCESAR ENTRADA (SI HAY DESTINO)
    IF @almacenDest IS NOT NULL
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM Inv_inv_stock WHERE almacenId = @almacenDest AND productoId = @productoId AND propietarioTipo = @propietarioTipo AND proveedorId = @proveedorId)
            INSERT INTO Inv_inv_stock (almacenId, productoId, propietarioTipo, proveedorId, cantidad) VALUES (@almacenDest, @productoId, @propietarioTipo, @proveedorId, 0);

        SELECT @stockAntDest = cantidad FROM Inv_inv_stock WITH (UPDLOCK)
        WHERE almacenId = @almacenDest AND productoId = @productoId AND propietarioTipo = @propietarioTipo AND proveedorId = @proveedorId;

        UPDATE Inv_inv_stock SET cantidad = cantidad + ABS(@cantidad)
        WHERE almacenId = @almacenDest AND productoId = @productoId AND propietarioTipo = @propietarioTipo AND proveedorId = @proveedorId;

        INSERT INTO Inv_inv_movimiento_detalle (idMovimiento, productoId, propietarioTipo, proveedorId, cantidad, costoUnitario, stockAnterior, stockNuevo)
        VALUES (@idMovimiento, @productoId, @propietarioTipo, @proveedorId, ABS(@cantidad), @costoUnitario, @stockAntDest, @stockAntDest + ABS(@cantidad));
    END
END
-- PROCEDIMIENTO: OBTENER STOCK ACTUAL
GO