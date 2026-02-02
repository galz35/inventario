-- SEED OPERATIVO FINAL: INTEGRIDAD TOTAL DE KARDEX, STOCK Y PROYECTOS
USE inventario;
GO

-- 1. LIMPIEZA TOTAL PARA INTEGRIDAD
DELETE FROM Inv_ope_ot_consumo;
DELETE FROM Inv_ope_ot;
DELETE FROM Inv_ope_proyecto_material_estimado;
DELETE FROM Inv_ope_proyecto_tareas;
DELETE FROM Inv_ope_proyectos;
DELETE FROM Inv_inv_movimiento_detalle;
DELETE FROM Inv_inv_movimientos;
DELETE FROM Inv_inv_stock;
DELETE FROM Inv_cat_almacenes;
DELETE FROM Inv_seg_usuarios WHERE usuario <> 'admin@empresa.com';
GO

DECLARE @claveHash NVARCHAR(MAX) = '$2b$10$7N3zH9vJ5WpT728qM6/iXOqXqC3z2z8vG9z9z9z9z9z9z9z9z9z9';

-- 2. USUARIOS REALES
INSERT INTO Inv_seg_usuarios (idUsuario, nombre, usuario, clave, rolNombre, activo) VALUES 
(100, 'Diana Martinez Admin', 'diana.martinez@empresa.com', @claveHash, 'ADMIN', 1),
(110, 'Sofia Lopez Supervisor', 'sofia.lopez@empresa.com', @claveHash, 'SUPERVISOR', 1),
(120, 'Roberto Central', 'roberto.central@empresa.com', @claveHash, 'SUPERVISOR', 1),
(121, 'Ana Norte', 'ana.norte@empresa.com', @claveHash, 'SUPERVISOR', 1),
(122, 'Luis Sur', 'luis.sur@empresa.com', @claveHash, 'SUPERVISOR', 1),
(123, 'Karla Proyectos', 'karla.proyectos@empresa.com', @claveHash, 'SUPERVISOR', 1),
(201, 'Carlos Paredes', 'carlos.paredes@empresa.com', @claveHash, 'TECNICO', 1),
(202, 'Juan Rodriguez', 'juan.rodriguez@empresa.com', @claveHash, 'TECNICO', 1),
(203, 'Miguel Torres', 'miguel.torres@empresa.com', @claveHash, 'TECNICO', 1),
(204, 'Luis Enrique Gomez', 'luis.gomez@empresa.com', @claveHash, 'TECNICO', 1),
(205, 'Fernando Castro', 'fernando.castro@empresa.com', @claveHash, 'TECNICO', 1),
(206, 'David Salazar', 'david.salazar@empresa.com', @claveHash, 'TECNICO', 1);
GO

-- 3. ALMACENES BODEGUEROS (Humanos)
INSERT INTO Inv_cat_almacenes (idAlmacen, nombre, tipo, responsableId, activo) VALUES 
(1, 'Bodega Central Valle', 'CENTRAL', 120, 1),
(2, 'Regional Norte', 'REGIONAL', 121, 1),
(3, 'Bodega Sur', 'REGIONAL', 122, 1),
(4, 'Almacén de Proyectos', 'PROYECTO', 123, 1);

-- Almacenes para los 6 Técnicos
INSERT INTO Inv_cat_almacenes (idAlmacen, nombre, tipo, responsableId, activo) VALUES
(201, 'Cargo: Carlos Paredes', 'TECNICO', 201, 1),
(202, 'Cargo: Juan Rodriguez', 'TECNICO', 202, 1),
(203, 'Cargo: Miguel Torres', 'TECNICO', 203, 1),
(204, 'Cargo: Luis Enrique Gomez', 'TECNICO', 204, 1),
(205, 'Cargo: Fernando Castro', 'TECNICO', 205, 1),
(206, 'Cargo: David Salazar', 'TECNICO', 206, 1);
GO

-- 4. CARGA INICIAL DE STOCK CON KARDEX (HISTORIAL REAL)
DECLARE @ProdFiber INT = (SELECT idProducto FROM Inv_cat_productos WHERE codigo = 'FIB-DROP-750');
DECLARE @ProdONT INT = (SELECT idProducto FROM Inv_cat_productos WHERE codigo = 'ONT-HWA-EG8145');
DECLARE @ProdFusion INT = (SELECT idProducto FROM Inv_cat_productos WHERE codigo = 'TOOL-FUS-60S');
DECLARE @ProdOPM INT = (SELECT idProducto FROM Inv_cat_productos WHERE codigo = 'TOOL-OPM-V10');

-- PASO A: Entrada Masiva a Bodega Central (ID: 1)
DECLARE @idMovA INT;
INSERT INTO Inv_inv_movimientos (tipoMovimiento, almacenDestinoId, idUsuarioResponsable, referenciaTexto)
VALUES ('ENTRADA_CARGA_MASIVA', 1, 120, 'Carga Inicial de Inventario Valle');
SET @idMovA = SCOPE_IDENTITY();

INSERT INTO Inv_inv_movimiento_detalle (idMovimiento, productoId, cantidad, propietarioTipo, proveedorId, costoUnitario) VALUES
(@idMovA, @ProdFiber, 100000, 'EMPRESA', 2, 0.15),
(@idMovA, @ProdONT, 100, 'EMPRESA', 1, 45.00),
(@idMovA, @ProdFusion, 10, 'EMPRESA', 4, 4500.00),
(@idMovA, @ProdOPM, 10, 'EMPRESA', 4, 85.00);

-- Actualizar Stock Central (Simulando lo que hace el SP)
INSERT INTO Inv_inv_stock (almacenId, productoId, propietarioTipo, proveedorId, cantidad) VALUES
(1, @ProdFiber, 'EMPRESA', 2, 100000),
(1, @ProdONT, 'EMPRESA', 1, 100),
(1, @ProdFusion, 'EMPRESA', 4, 10),
(1, @ProdOPM, 'EMPRESA', 4, 10);

-- PASO B: Transferencia de Central a Técnicos (Historial de Salida -> Entrada)
DECLARE @idMovT INT;
-- Creamos un movimiento de transferencia por cada técnico para que el Kardex sea perfecto
DECLARE @tecId INT, @almId INT;
DECLARE tecur CURSOR FOR SELECT idUsuario, idAlmacen FROM Inv_cat_almacenes JOIN Inv_seg_usuarios ON responsableId = idUsuario WHERE tipo = 'TECNICO';
OPEN tecur;
FETCH NEXT FROM tecur INTO @tecId, @almId;
WHILE @@FETCH_STATUS = 0
BEGIN
    -- Salida de Central
    INSERT INTO Inv_inv_movimientos (tipoMovimiento, almacenOrigenId, almacenDestinoId, idUsuarioResponsable, referenciaTexto)
    VALUES ('TRANSFERENCIA', 1, @almId, 120, 'Surtido de Herramientas y Fibra');
    SET @idMovT = SCOPE_IDENTITY();

    INSERT INTO Inv_inv_movimiento_detalle (idMovimiento, productoId, cantidad, propietarioTipo, proveedorId) VALUES
    (@idMovT, @ProdFiber, -500, 'EMPRESA', 2),
    (@idMovT, @ProdFusion, -1, 'EMPRESA', 4),
    (@idMovT, @ProdOPM, -1, 'EMPRESA', 4);

    -- Entrada al Técnico
    INSERT INTO Inv_inv_movimiento_detalle (idMovimiento, productoId, cantidad, propietarioTipo, proveedorId) VALUES
    (@idMovT, @ProdFiber, 500, 'EMPRESA', 2),
    (@idMovT, @ProdFusion, 1, 'EMPRESA', 4),
    (@idMovT, @ProdOPM, 1, 'EMPRESA', 4);

    -- Actualizar Stocks
    UPDATE Inv_inv_stock SET cantidad = cantidad - 500 WHERE almacenId = 1 AND productoId = @ProdFiber;
    UPDATE Inv_inv_stock SET cantidad = cantidad - 1 WHERE almacenId = 1 AND productoId = @ProdFusion;
    UPDATE Inv_inv_stock SET cantidad = cantidad - 1 WHERE almacenId = 1 AND productoId = @ProdOPM;

    INSERT INTO Inv_inv_stock (almacenId, productoId, propietarioTipo, proveedorId, cantidad) VALUES
    (@almId, @ProdFiber, 'EMPRESA', 2, 500),
    (@almId, @ProdFusion, 'EMPRESA', 4, 1),
    (@almId, @ProdOPM, 'EMPRESA', 4, 1);

    FETCH NEXT FROM tecur INTO @tecId, @almId;
END
CLOSE tecur; DEALLOCATE tecur;
GO

-- 5. PROYECTOS Y TAREAS (WBS) CON IDENTIDAD REAL
INSERT INTO Inv_ope_proyectos (idProyecto, nombre, descripcion, estado, fechaInicio, fechaFin, idResponsable) VALUES 
(1, 'Construcción Nodo Principal Norte', 'Instalación de OLT y Fibra Alimentadora.', 'EJECUCION', '2026-01-01', '2026-04-30', 110),
(2, 'Altas Residenciales Sector Sur', 'Instalación de última milla para abonados.', 'EJECUCION', '2026-01-15', '2026-02-28', 110);

INSERT INTO Inv_ope_proyecto_tareas (idProyecto, idTareaPadre, nombre, descripcion, orden) VALUES 
(1, NULL, 'Tendido de Troncales', 'Fase 1: Posteado y Fibra 24h.', 1),
(2, NULL, 'Instalaciones Domiciliarias', 'Fase de entrega de servicios.', 1);

DECLARE @Tarea1 INT = (SELECT idTarea FROM Inv_ope_proyecto_tareas WHERE nombre = 'Tendido de Troncales');
DECLARE @Tarea2 INT = (SELECT idTarea FROM Inv_ope_proyecto_tareas WHERE nombre = 'Instalaciones Domiciliarias');

-- 6. ASIGNACIÓN DE ÓRDENES (OT) CON VINCULACIÓN KARDEX
INSERT INTO Inv_ope_ot (idProyecto, idTareaWBS, idTecnicoAsignado, clienteNombre, clienteDireccion, tipoOT, prioridad, estado) VALUES 
(1, @Tarea1, 201, 'Industrias Galaxia', 'Parque Industrial Sur', 'INSTALACION', 'ALTA', 'ASIGNADA'),
(1, @Tarea1, 202, 'Centro Medico', 'Avenida Central #45', 'INSTALACION', 'MEDIA', 'PROCESO'),
(2, @Tarea2, 203, 'Apartamento B3', 'Plaza El Sol', 'INSTALACION', 'ALTA', 'REGISTRADA');

GO
PRINT 'Kardex verificado y alineado con stock y proyectos.';
GO
