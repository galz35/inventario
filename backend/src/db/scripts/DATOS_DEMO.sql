-- =============================================
-- SCRIPT DE DATOS PARA DEMOSTRACIÓN (INVCORE)
-- =============================================
-- Este script inserta datos controlados para lucir las nuevas funcionalidades.
-- Ejecutar en base de datos 'inventario'.

-- 1. ASEGURAR ALMACENES CLAVE
IF NOT EXISTS (SELECT 1 FROM Inv_cat_almacenes WHERE nombre = 'Bodega Central')
INSERT INTO Inv_cat_almacenes (nombre, tipo, ubicacion) VALUES ('Bodega Central', 'FISICO', 'Sede Principal');

IF NOT EXISTS (SELECT 1 FROM Inv_cat_almacenes WHERE nombre = 'Móvil Técnico Demo')
INSERT INTO Inv_cat_almacenes (nombre, tipo, ubicacion) VALUES ('Móvil Técnico Demo', 'MOVIL', 'Unidad T-01');

DECLARE @idBodega INT = (SELECT top 1 idAlmacen FROM Inv_cat_almacenes WHERE nombre = 'Bodega Central');
DECLARE @idMovil INT = (SELECT top 1 idAlmacen FROM Inv_cat_almacenes WHERE nombre = 'Móvil Técnico Demo');
DECLARE @idUser INT = 203; -- Miguel Torres (Admin) para movimientos
DECLARE @idTech INT = 201; -- Carlos Paredes (Tecnico) para asignaciones

-- 2. CREAR PRODUCTOS ESTRELLA (Para el Timeline y Activos)
IF NOT EXISTS (SELECT 1 FROM Inv_cat_productos WHERE codigo = 'ONT-HUA-01')
INSERT INTO Inv_cat_productos (codigo, nombre, unidad)
VALUES ('ONT-HUA-01', 'Modem Fibra Óptica Huawei HG8245', 'UND');

IF NOT EXISTS (SELECT 1 FROM Inv_cat_productos WHERE codigo = 'CABLE-UTP-CAT6')
INSERT INTO Inv_cat_productos (codigo, nombre, unidad)
VALUES ('CABLE-UTP-CAT6', 'Cable UTP Cat 6 Exterior', 'MTS');

DECLARE @idOnt INT = (SELECT idProducto FROM Inv_cat_productos WHERE codigo = 'ONT-HUA-01');
DECLARE @idCable INT = (SELECT idProducto FROM Inv_cat_productos WHERE codigo = 'CABLE-UTP-CAT6');

-- 3. POBLAR HISTORIAL (Para probar el Timeline Visual)

-- A) Entrada Masiva a Bodega (Hace 5 días)
IF NOT EXISTS (SELECT 1 FROM Inv_inv_movimientos WHERE referenciaTexto = 'DEMO_COMPRA_001')
BEGIN
    INSERT INTO Inv_inv_movimientos (tipoMovimiento, fechaMovimiento, almacenDestinoId, idUsuarioResponsable, referenciaTexto, notas)
    VALUES ('ENTRADA_COMPRA', DATEADD(DAY, -5, GETDATE()), @idBodega, @idUser, 'DEMO_COMPRA_001', 'Compra Lote Importación');
    
    DECLARE @idMov1 INT = SCOPE_IDENTITY();
    
    INSERT INTO Inv_inv_movimiento_detalle (idMovimiento, productoId, cantidad, stockNuevo)
    VALUES (@idMov1, @idOnt, 100, 100);
END

-- B) Transferencia a Técnico (Hace 3 días)
IF NOT EXISTS (SELECT 1 FROM Inv_inv_movimientos WHERE referenciaTexto = 'DEMO_TRANSF_001')
BEGIN
    INSERT INTO Inv_inv_movimientos (tipoMovimiento, fechaMovimiento, almacenOrigenId, almacenDestinoId, idUsuarioResponsable, referenciaTexto)
    VALUES ('TRANSFERENCIA_ENVIADA', DATEADD(DAY, -3, GETDATE()), @idBodega, @idMovil, @idUser, 'DEMO_TRANSF_001');
    
    DECLARE @idMov2 INT = SCOPE_IDENTITY();
    
    INSERT INTO Inv_inv_movimiento_detalle (idMovimiento, productoId, cantidad, stockNuevo)
    VALUES (@idMov2, @idOnt, -10, 90); -- Salen 10 de Bodega
END

-- C) Confirmación Transferencia (Simulada para stock)
MERGE Inv_inv_stock AS target
USING (SELECT @idMovil as alm, @idOnt as prod) AS source
ON (target.almacenId = source.alm AND target.productoId = source.prod)
WHEN MATCHED THEN
    UPDATE SET cantidad = 10
WHEN NOT MATCHED THEN
    INSERT (almacenId, productoId, cantidad, propietarioTipo, proveedorId)
    VALUES (@idMovil, @idOnt, 10, 'EMPRESA', 0);

-- 4. INSERTAR SERIALES DE PRUEBA (Para el Buscador "Google")
-- SN-DEMO-001 (En Bodega)
IF NOT EXISTS (SELECT 1 FROM Inv_act_activos WHERE serial = 'SN-DEMO-001')
INSERT INTO Inv_act_activos (serial, idProducto, estado, idAlmacenActual, fechaIngreso)
VALUES ('SN-DEMO-001', @idOnt, 'DISPONIBLE', @idBodega, GETDATE());

-- SN-DEMO-002 (En Manos del Técnico)
IF NOT EXISTS (SELECT 1 FROM Inv_act_activos WHERE serial = 'SN-DEMO-002')
INSERT INTO Inv_act_activos (serial, idProducto, estado, idAlmacenActual, idTecnicoActual, fechaIngreso)
VALUES ('SN-DEMO-002', @idOnt, 'ASIGNADO', @idMovil, @idTech, GETDATE()); 

-- SN-DEMO-003 (Instalado donde Cliente)
-- Aseguramos que exista un cliente 1
IF NOT EXISTS (SELECT 1 FROM Inv_cat_clientes WHERE idCliente = 1)
INSERT INTO Inv_cat_clientes (nombre, direccion, telefono, activo)
VALUES ('Cliente Demo 1', 'Dirección Demo 123', '555-1234', 1);

IF NOT EXISTS (SELECT 1 FROM Inv_act_activos WHERE serial = 'SN-DEMO-003')
INSERT INTO Inv_act_activos (serial, idProducto, estado, idClienteActual, fechaIngreso)
VALUES ('SN-DEMO-003', @idOnt, 'INSTALADO', 1, GETDATE());

-- 5. STOCK CERO (Para probar el Semáforo Rojo)
-- Nos aseguramos que el cable NO tenga stock en el móvil del técnico
DELETE FROM Inv_inv_stock WHERE almacenId = @idMovil AND productoId = @idCable;

SELECT 'Datos de Demo Cargados Correctamente' as Mensaje;
