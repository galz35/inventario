GO

/*
================================================================================
SCRIPT DE CARGA INICIAL (SEEDER) - DATOS DE PRUEBA REALISTAS
ESTE SCRIPT DEBE EJECUTARSE DESPUÉS DEL SCHEMA (Inv_Schema.sql)
================================================================================
*/

-- 1. ROLES Y USUARIOS
SET IDENTITY_INSERT Inv_seg_roles ON;
INSERT INTO Inv_seg_roles (idRol, nombre, descripcion) VALUES (1, 'Administrador', 'Control total del sistema');
INSERT INTO Inv_seg_roles (idRol, nombre, descripcion) VALUES (2, 'Técnico', 'Acceso a ejecución de OT y stock propio');
SET IDENTITY_INSERT Inv_seg_roles OFF;

-- Usuarios (Password default: admin123 hashed)
INSERT INTO Inv_seg_usuarios (nombre, correo, carnet, password, idRol) 
VALUES ('Administrador Sistema', 'admin@empresa.com', 'ADMIN01', '$2b$10$7v5J...MOCKED_HASH...', 1);
INSERT INTO Inv_seg_usuarios (nombre, correo, carnet, password, idRol) 
VALUES ('Juan Pérez (Técnico)', 'juan.perez@empresa.com', 'TEC001', '$2b$10$7v5J...MOCKED_HASH...', 2);
INSERT INTO Inv_seg_usuarios (nombre, correo, carnet, password, idRol) 
VALUES ('Carlos Ruiz (Técnico)', 'carlos.ruiz@empresa.com', 'TEC002', '$2b$10$7v5J...MOCKED_HASH...', 2);

-- 2. CATÁLOGOS BASE
INSERT INTO Inv_cat_proveedores (nombre, nit, contacto) VALUES ('Telecom Global Inc', '900123456-1', 'Maria Garcia');
INSERT INTO Inv_cat_proveedores (nombre, nit, contacto) VALUES ('Distribuidora Eléctrica', '800654321-0', 'Jose Rodriguez');

INSERT INTO Inv_cat_categorias_producto (nombre, descripcion) VALUES ('Equipos ONT', 'Modems de fibra óptica');
INSERT INTO Inv_cat_categorias_producto (nombre, descripcion) VALUES ('Consumibles', 'Cables, conectores, herrajes');
INSERT INTO Inv_cat_categorias_producto (nombre, descripcion) VALUES ('Herramientas', 'Equipos de medición y fusión');

-- Productos
INSERT INTO Inv_cat_productos (codigo, nombre, idCategoria, unidad, esSerializado, costo, minimoStock) 
VALUES ('MDM-ONT-01', 'ONT Dual Band GPON', 1, 'unidades', 1, 45.50, 20);
INSERT INTO Inv_cat_productos (codigo, nombre, idCategoria, unidad, esSerializado, costo, minimoStock) 
VALUES ('CBL-UTP-C6', 'Cable UTP Cat 6 Exterior', 2, 'metros', 0, 0.25, 1000);
INSERT INTO Inv_cat_productos (codigo, nombre, idCategoria, unidad, esSerializado, costo, minimoStock) 
VALUES ('FUS-FJK-70', 'Fusionadora Fujikura 70S', 3, 'unidades', 1, 2500.00, 2);

-- 3. ALMACENES (JERARQUÍA)
SET IDENTITY_INSERT Inv_cat_almacenes ON;
INSERT INTO Inv_cat_almacenes (idAlmacen, nombre, tipo, ubicacion) VALUES (1, 'Bodega Central', 'CENTRAL', 'Zona Industrial 5');
INSERT INTO Inv_cat_almacenes (idAlmacen, nombre, tipo, idPadre) VALUES (2, 'Regional Norte', 'REGIONAL', 1);
SET IDENTITY_INSERT Inv_cat_almacenes OFF;

-- Almacenes de Técnicos (Vinculados a sus carnets)
DECLARE @idUser1 INT, @idUser2 INT;
SELECT @idUser1 = idUsuario FROM Inv_seg_usuarios WHERE carnet = 'TEC001';
SELECT @idUser2 = idUsuario FROM Inv_seg_usuarios WHERE carnet = 'TEC002';

INSERT INTO Inv_cat_almacenes (nombre, tipo, idPadre, responsableId) VALUES ('Camioneta - Juan Pérez', 'TECNICO', 1, @idUser1);
INSERT INTO Inv_cat_almacenes (nombre, tipo, idPadre, responsableId) VALUES ('Camioneta - Carlos Ruiz', 'TECNICO', 1, @idUser2);

-- Actualizar FK en usuarios para acceso rápido
UPDATE Inv_seg_usuarios SET idAlmacenTecnico = (SELECT idAlmacen FROM Inv_cat_almacenes WHERE responsableId = @idUser1) WHERE idUsuario = @idUser1;
UPDATE Inv_seg_usuarios SET idAlmacenTecnico = (SELECT idAlmacen FROM Inv_cat_almacenes WHERE responsableId = @idUser2) WHERE idUsuario = @idUser2;

-- 4. STOCK INICIAL
INSERT INTO Inv_inv_stock (almacenId, productoId, cantidad) 
SELECT 1, idProducto, 100 FROM Inv_cat_productos WHERE codigo = 'MDM-ONT-01';
INSERT INTO Inv_inv_stock (almacenId, productoId, cantidad) 
SELECT 1, idProducto, 5000 FROM Inv_cat_productos WHERE codigo = 'CBL-UTP-C6';

-- 5. ACTIVOS SERIALIZADOS
DECLARE @idProdONT INT;
SELECT @idProdONT = idProducto FROM Inv_cat_productos WHERE codigo = 'MDM-ONT-01';

INSERT INTO Inv_act_activos (serial, idProducto, estado, idAlmacenActual) VALUES ('SN-ONT-2026-001', @idProdONT, 'DISPONIBLE', 1);
INSERT INTO Inv_act_activos (serial, idProducto, estado, idAlmacenActual) VALUES ('SN-ONT-2026-002', @idProdONT, 'DISPONIBLE', 1);
INSERT INTO Inv_act_activos (serial, idProducto, estado, idAlmacenActual) VALUES ('SN-ONT-2026-003', @idProdONT, 'DISPONIBLE', 1);

-- 6. TIPOS DE OT
INSERT INTO Inv_cat_tipos_ot (nombre, requiereFirma, requiereEvidencia, requiereEquipoSerializado) 
VALUES ('Instalación Residencial', 1, 1, 1);
INSERT INTO Inv_cat_tipos_ot (nombre, requiereFirma, requiereEvidencia, requiereEquipoSerializado) 
VALUES ('Mantenimiento Predictivo', 1, 0, 0);

PRINT 'SEEDED DATA LOADED SUCCESSFULLY.';
GO
