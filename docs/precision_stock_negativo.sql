-- REFUERZO DE PRECISIÓN: BLOQUEO DE STOCK NEGATIVO
USE inventario;
GO

PRINT 'Actualizando Inv_sp_inv_movimiento_procesar_item para bloquear stock negativo...';

CREATE OR ALTER PROCEDURE Inv_sp_inv_movimiento_procesar_item
    @idMovimiento INT,
    @productoId INT,
    @cantidad DECIMAL(18,2), 
    @propietarioTipo NVARCHAR(20) = 'EMPRESA',
    @proveedorId INT = 0,
    @costoUnitario DECIMAL(18,2) = 0
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @almacenOrig INT, @almacenDest INT, @tipoMov NVARCHAR(50);
    DECLARE @stockAntOrig DECIMAL(18,2) = 0, @stockAntDest DECIMAL(18,2) = 0;
    DECLARE @nombreProd NVARCHAR(200);

    SELECT @nombreProd = nombre FROM Inv_cat_productos WHERE idProducto = @productoId;

    -- Obtener datos de la cabecera
    SELECT @almacenOrig = almacenOrigenId, @almacenDest = almacenDestinoId, @tipoMov = tipoMovimiento
    FROM Inv_inv_movimientos WHERE idMovimiento = @idMovimiento;

    -- 1. PROCESAR SALIDA (SI HAY ORIGEN)
    IF @almacenOrig IS NOT NULL
    BEGIN
        SELECT @stockAntOrig = ISNULL(cantidad, 0) FROM Inv_inv_stock WITH (UPDLOCK)
        WHERE almacenId = @almacenOrig AND productoId = @productoId AND propietarioTipo = @propietarioTipo AND proveedorId = @proveedorId;

        -- BLOQUEO DURO: No permitir stock negativo
        IF (@stockAntOrig - ABS(@cantidad)) < 0
        BEGIN
            DECLARE @errorMsg NVARCHAR(500) = 'ERROR: Stock insuficiente para ' + @nombreProd + ' [ID:' + CAST(@productoId AS NVARCHAR(10)) + '].' + CHAR(13) + 
                                             'Disponible: ' + CAST(@stockAntOrig AS NVARCHAR(20)) + ', Requerido: ' + CAST(ABS(@cantidad) AS NVARCHAR(20)) + 
                                             '. En Almacén ID: ' + CAST(@almacenOrig AS NVARCHAR(10));
            THROW 50001, @errorMsg, 1;
        END

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
GO

PRINT 'Bloqueo de stock negativo implementado.';
GO
