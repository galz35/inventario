
-- =============================================
-- SCRIPT DE LIMPIEZA Y CARGA DE DATOS MAESTROS REALISTAS
-- Objetivo: Eliminar datos "Test" y cargar catálogo de Telecomunicaciones/FTTH real.
-- =============================================

-- 1. LIMPIEZA DE TRANSACCIONES Y DATOS DE PRUEBA
-- (El orden respeta las FKs basadas en el esquema detectado)

-- Operaciones y Proyectos
DELETE FROM Inv_ope_ot_evidencias;
DELETE FROM Inv_ope_ot_firmas;
DELETE FROM Inv_ope_ot_consumo;
DELETE FROM Inv_ope_ot;
DELETE FROM Inv_ope_proyecto_material_estimado;
DELETE FROM Inv_ope_proyecto_tareas;
DELETE FROM Inv_ope_proyectos;

-- Inventario y Movimientos
DELETE FROM Inv_inv_movimiento_detalle;
DELETE FROM Inv_inv_movimientos;
DELETE FROM Inv_inv_stock;
DELETE FROM Inv_inv_transferencia_detalle;
DELETE FROM Inv_inv_transferencias;
DELETE FROM Inv_inv_ajustes;
DELETE FROM Inv_inv_conteos_detalle;
DELETE FROM Inv_inv_conteos_cabecera;

-- Activos
DELETE FROM Inv_act_reparaciones;
DELETE FROM Inv_act_movimientos;
DELETE FROM Inv_act_activos;

-- 2. REINICIO DE IDENTIDADES
-- (Usando nombres de tabla correctos según esquema)
DBCC CHECKIDENT ('Inv_inv_movimientos', RESEED, 0);
DBCC CHECKIDENT ('Inv_ope_ot', RESEED, 0);
DBCC CHECKIDENT ('Inv_ope_proyectos', RESEED, 0);
DBCC CHECKIDENT ('Inv_ope_proyecto_tareas', RESEED, 0);
DBCC CHECKIDENT ('Inv_act_activos', RESEED, 0);

-- 3. CARGA DE CATÁLOGO REALISTA (Telecomunicaciones / Fibra Óptica)
-- Limpiar catálogo previo
DELETE FROM Inv_cat_productos;
DELETE FROM Inv_cat_categorias_producto;

-- Categorías (Se usa Inv_cat_categorias_producto)
INSERT INTO Inv_cat_categorias_producto (nombre, descripcion, activo) VALUES 
('EQUIPOS DE RED', 'Routers, ONTs, Switches y equipos activos', 1),
('CABLEADO', 'Cables de fibra óptica, UTP y acometidas', 1),
('PASIVOS', 'Splitters, Cajas NAP, Rosetas y herramientas de empalme', 1),
('HERRAMIENTAS', 'Fusionadoras, Power Meters, OTDRs y herramientas de mano', 1),
('ACTIVOS FIJOS', 'Vehículos, Escaleras y Mobiliario', 1);

DECLARE @CatRed INT = (SELECT idCategoria FROM Inv_cat_categorias_producto WHERE nombre = 'EQUIPOS DE RED');
DECLARE @CatCable INT = (SELECT idCategoria FROM Inv_cat_categorias_producto WHERE nombre = 'CABLEADO');
DECLARE @CatPasivos INT = (SELECT idCategoria FROM Inv_cat_categorias_producto WHERE nombre = 'PASIVOS');
DECLARE @CatTools INT = (SELECT idCategoria FROM Inv_cat_categorias_producto WHERE nombre = 'HERRAMIENTAS');
DECLARE @CatFijos INT = (SELECT idCategoria FROM Inv_cat_categorias_producto WHERE nombre = 'ACTIVOS FIJOS');

-- Productos (Realistas)
INSERT INTO Inv_cat_productos (codigo, nombre, idCategoria, unidad, esSerializado, costo, minimoStock, activo, fechaCreacion) VALUES
('ONT-HW-8245', 'ONT Huawei EG8245H5 Dual Band', @CatRed, 'UND', 1, 45.00, 50, 1, GETDATE()),
('ONT-NK-G242', 'ONT Nokia G-2425G-A Wi-Fi 6', @CatRed, 'UND', 1, 65.00, 20, 1, GETDATE()),
('CBL-FIB-1H', 'Cable Drop Fibra G.657A1 1 Hilo (Bobina 1km)', @CatCable, 'MTR', 0, 0.12, 5000, 1, GETDATE()),
('CBL-UTP-C6', 'Cable UTP Cat 6 Exterior (Caja 305m)', @CatCable, 'MTR', 0, 0.45, 1000, 1, GETDATE()),
('NAP-16P', 'Caja NAP 16 Puertos Exterior IP65', @CatPasivos, 'UND', 0, 28.50, 40, 1, GETDATE()),
('SPL-1-8', 'Splitter PLC 1X8 con Conectores SC/APC', @CatPasivos, 'UND', 0, 8.20, 100, 1, GETDATE()),
('ROS-FO', 'Roseta Óptica Mural Blanca', @CatPasivos, 'UND', 0, 1.50, 300, 1, GETDATE()),
('PATCH-3M', 'Patch Cord Fibra SC/APC-SC/APC 3M Simplex', @CatPasivos, 'UND', 0, 2.75, 500, 1, GETDATE()),
('FUS-FS-80', 'Fusionadora de Fibra Óptica Sumitomo T-72C', @CatTools, 'UND', 1, 3500.00, 2, 1, GETDATE()),
('OPM-X10', 'Power Meter Óptico Digital -70 a +10 dBm', @CatTools, 'UND', 1, 120.00, 10, 1, GETDATE());

-- Activos Fijos
INSERT INTO Inv_cat_productos (codigo, nombre, idCategoria, unidad, esSerializado, costo, minimoStock, activo, fechaCreacion) VALUES
('VEH-PICKUP', 'Vehículo Pick-up Toyota Hilux 4x4 (Unidad Técnica)', @CatFijos, 'UND', 1, 32000.00, 1, 1, GETDATE()),
('ESC-T-28', 'Escalera de Extensión de Fibra de Vidrio 28 Pies', @CatFijos, 'UND', 1, 450.00, 5, 1, GETDATE());

-- 4. PROYECTOS REALISTAS
-- Buscar un usuario administrador válido para asignar responsabilidad
DECLARE @AdminId INT = (SELECT TOP 1 idUsuario FROM Inv_seg_usuarios WHERE activo = 1 ORDER BY idUsuario ASC);

INSERT INTO Inv_ope_proyectos (nombre, descripcion, idResponsable, fechaInicio, estado, fechaCreacion) VALUES
('EXPANSIÓN FTTH NORTE PH-1', 'Despliegue de red de fibra óptica en zona residencial norte, Fase 1.', @AdminId, GETDATE(), 'ACTIVO', GETDATE()),
('MANTENIMIENTO PREVENTIVO TRONCAL 400', 'Revisión y saneamiento de cajas NAP en troncal principal.', @AdminId, GETDATE(), 'ACTIVO', GETDATE());

DECLARE @ProjId INT = (SELECT idProyecto FROM Inv_ope_proyectos WHERE nombre = 'EXPANSIÓN FTTH NORTE PH-1');

-- Tareas WBS (Usando columnas detectadas: fechaInicioPrevista, fechaFinPrevista)
INSERT INTO Inv_ope_proyecto_tareas (idProyecto, nombre, descripcion, fechaInicioPrevista, estado, orden) VALUES
(@ProjId, 'PREPARACIÓN Y RELEVAMIENTO', 'Levantamiento de infraestructura de postes existente.', GETDATE(), 'COMPLETADO', 1),
(@ProjId, 'TIENDIDO DE CABLE MENSAJERO', 'Instalación de guaya de acero en postes.', GETDATE(), 'ACTIVO', 2),
(@ProjId, 'FUSIONADO DE TRONCALES', 'Empalmes de fibra en cierres de alta capacidad.', GETDATE(), 'PENDIENTE', 3);

-- 5. STOCK INICIAL
-- Obtener almacén principal
DECLARE @AlmPrincipal INT = (SELECT TOP 1 idAlmacen FROM Inv_cat_almacenes WHERE tipo = 'BODEGA_CENTRAL' OR activo = 1);

-- Cargar stock (Columnas: almacenId, productoId, propietarioTipo, proveedorId, cantidad)
INSERT INTO Inv_inv_stock (almacenId, productoId, propietarioTipo, proveedorId, cantidad)
SELECT @AlmPrincipal, idProducto, 'EMPRESA', 0, 100 
FROM Inv_cat_productos 
WHERE esSerializado = 0;

-- Alta de Activos (Equipos Serializados)
DECLARE @ProdONT INT = (SELECT idProducto FROM Inv_cat_productos WHERE codigo = 'ONT-HW-8245');
DECLARE @ProdFusion INT = (SELECT idProducto FROM Inv_cat_productos WHERE codigo = 'FUS-FS-80');

INSERT INTO Inv_act_activos (serial, idProducto, estado, idAlmacenActual, fechaIngreso) VALUES
('SN-HW-2024-001', @ProdONT, 'ALMACEN', @AlmPrincipal, GETDATE()),
('SN-HW-2024-002', @ProdONT, 'ALMACEN', @AlmPrincipal, GETDATE()),
('FUS-S72C-889', @ProdFusion, 'ALMACEN', @AlmPrincipal, GETDATE());

PRINT 'Finalizado: Sistema limpio con datos realistas de infraestructura FTTH.';
