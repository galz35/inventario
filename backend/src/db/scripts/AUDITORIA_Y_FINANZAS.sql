USE inventario;
GO

-------------------------------------------------------------------------
-- 1. TABLA HISTÓRICA (ESPEJO DE AUDITORÍA)
-------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'Inv_sis_auditoria_stock') AND type in (N'U'))
BEGIN
    CREATE TABLE Inv_sis_auditoria_stock (
        idAuditoria INT IDENTITY(1,1) PRIMARY KEY,
        almacenId INT,
        productoId INT,
        cantidadAnterior DECIMAL(18,2),
        cantidadNueva DECIMAL(18,2),
        diferencia AS (cantidadNueva - cantidadAnterior),
        fechaCambio DATETIME DEFAULT GETDATE(),
        -- Metadatos del entorno
        usuarioDB NVARCHAR(100) DEFAULT SYSTEM_USER,
        hostName NVARCHAR(100) DEFAULT HOST_NAME(),
        appName NVARCHAR(100) DEFAULT APP_NAME()
    );
    PRINT 'Tabla Inv_sis_auditoria_stock creada.';
END
GO

-------------------------------------------------------------------------
-- 2. TRIGGER DE BLINDAJE (AFTER UPDATE)
-------------------------------------------------------------------------
CREATE OR ALTER TRIGGER Inv_trg_auditoria_stock
ON Inv_inv_stock
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Solo insertar si hay filas afectadas y hubo cambio real de cantidad
    IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO Inv_sis_auditoria_stock (almacenId, productoId, cantidadAnterior, cantidadNueva)
        SELECT 
            i.almacenId,
            i.productoId,
            d.cantidad, -- Valor antes del update
            i.cantidad  -- Valor después del update
        FROM inserted i
        JOIN deleted d ON i.almacenId = d.almacenId 
                      AND i.productoId = d.productoId
                      AND i.propietarioTipo = d.propietarioTipo
                      AND ISNULL(i.proveedorId, -1) = ISNULL(d.proveedorId, -1)
        WHERE i.cantidad <> d.cantidad; -- Condición clave: solo si el número cambió
    END
END
GO
PRINT 'Trigger Inv_trg_auditoria_stock actualizado/creado.';
GO

-------------------------------------------------------------------------
-- 3. VISTA FINANCIERA (PROYECCIÓN DE PAGOS A PROVEEDORES)
-------------------------------------------------------------------------
CREATE OR ALTER VIEW Inv_vw_liquidacion_consignacion_mes AS
SELECT 
    prov.nombre as Proveedor,
    p.nombre as Material,
    SUM(ABS(otc.cantidad)) as CantidadConsumida,
    p.costo as CostoUnitario,
    SUM(ABS(otc.cantidad) * p.costo) as TotalPagar,
    MONTH(otc.fechaConsumo) as Mes,
    YEAR(otc.fechaConsumo) as Anio
FROM Inv_ope_ot_consumo otc
JOIN Inv_ope_ot ot ON otc.idOT = ot.idOT -- Para filtrar por estado si fuera necesario
JOIN Inv_cat_productos p ON otc.productoId = p.idProducto
LEFT JOIN Inv_inv_movimiento_detalle md ON otc.idMovimientoInventario = md.idMovimiento
LEFT JOIN Inv_cat_proveedores prov ON md.proveedorId = prov.idProveedor
WHERE md.propietarioTipo = 'PROVEEDOR'
GROUP BY prov.nombre, p.nombre, p.costo, MONTH(otc.fechaConsumo), YEAR(otc.fechaConsumo);
GO
PRINT 'Vista Inv_vw_liquidacion_consignacion_mes actualizada/creada.';
