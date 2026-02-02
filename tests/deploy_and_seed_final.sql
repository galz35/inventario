-- ===================================================================
-- SCRIPT DE DESPLIEGUE OPERATIVO FINAL (INVCORE)
-- OBJETIVO: Sincronizar esquema, procedimientos y sembrar datos reales
-- SERVIDOR: RDS (54.146.235.205)
-- ===================================================================

USE inventario;
GO

-- 1. ACTUALIZACIoN DE ESQUEMA (Sincronizacion de Tablas de Planificacion)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Inv_ope_ot') AND name = 'idTareaWBS')
BEGIN
    ALTER TABLE Inv_ope_ot ADD idTareaWBS INT;
END

IF OBJECT_ID('Inv_ope_proyecto_material_estimado') IS NULL
BEGIN
    CREATE TABLE Inv_ope_proyecto_material_estimado (
        idTarea INT NOT NULL,
        productoId INT NOT NULL,
        cantidadEstimada DECIMAL(18,2) NOT NULL,
        idAlmacenSugerido INT NULL,
        PRIMARY KEY (idTarea, productoId)
    );
END

IF OBJECT_ID('Inv_ope_proyecto_tareas') IS NULL
BEGIN
    CREATE TABLE Inv_ope_proyecto_tareas (
        idTarea INT IDENTITY(1,1) PRIMARY KEY,
        idProyecto INT NOT NULL,
        idTareaPadre INT NULL,
        nombre NVARCHAR(200) NOT NULL,
        descripcion NVARCHAR(MAX) NULL,
        fechaInicioPrevista DATETIME NULL,
        fechaFinPrevista DATETIME NULL,
        orden INT DEFAULT 0,
        estado NVARCHAR(50) DEFAULT 'PLANIFICADA'
    );
END
GO

-- 2. PROCEDIMIENTOS ALMACENADOS (WBS y Planificacion)
PRINT 'Aplicando Procedimientos de Planificacion...';
GO
CREATE OR ALTER PROCEDURE Inv_sp_proyecto_tarea_crear
    @idProyecto INT,
    @idTareaPadre INT = NULL,
    @nombre NVARCHAR(200),
    @descripcion NVARCHAR(MAX) = NULL,
    @fechaInicio DATETIME = NULL,
    @fechaFin DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Inv_ope_proyecto_tareas (idProyecto, idTareaPadre, nombre, descripcion, fechaInicioPrevista, fechaFinPrevista)
    VALUES (@idProyecto, @idTareaPadre, @nombre, @descripcion, @fechaInicio, @fechaFin);
    SELECT SCOPE_IDENTITY() AS idTarea;
END
GO
CREATE OR ALTER PROCEDURE Inv_sp_proyecto_wbs_obtener
    @idProyecto INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM Inv_ope_proyecto_tareas 
    WHERE idProyecto = @idProyecto
    ORDER BY idTareaPadre ASC, orden ASC;
END
GO
CREATE OR ALTER PROCEDURE Inv_sp_proyecto_material_estimar
    @idTarea INT,
    @productoId INT,
    @cantidadEstimada DECIMAL(18,2),
    @idAlmacenSugerido INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM Inv_ope_proyecto_material_estimado WHERE idTarea = @idTarea AND productoId = @productoId)
    BEGIN
        UPDATE Inv_ope_proyecto_material_estimado 
        SET cantidadEstimada = @cantidadEstimada, idAlmacenSugerido = @idAlmacenSugerido
        WHERE idTarea = @idTarea AND productoId = @productoId;
    END
    ELSE
    BEGIN
        INSERT INTO Inv_ope_proyecto_material_estimado (idTarea, productoId, cantidadEstimada, idAlmacenSugerido)
        VALUES (@idTarea, @productoId, @cantidadEstimada, @idAlmacenSugerido);
    END
END
GO

-- 3. LIMPIEZA DE DATOS PREVIOS (Evitar conflictos de FK)
PRINT 'Limpiando datos previos...';
DELETE FROM Inv_ope_ot_consumo;
DELETE FROM Inv_ope_ot;
DELETE FROM Inv_ope_proyecto_material_estimado;
DELETE FROM Inv_ope_proyecto_tareas;
DELETE FROM Inv_ope_proyectos;
DELETE FROM Inv_inv_movimiento_detalle;
DELETE FROM Inv_inv_movimientos;
DELETE FROM Inv_inv_stock;
DELETE FROM Inv_cat_almacenes;
DELETE FROM Inv_seg_refresh_tokens;
DELETE FROM Inv_seg_usuarios WHERE correo <> 'admin@empresa.com';
DELETE FROM Inv_cat_productos;
DELETE FROM Inv_cat_proveedores;
GO

-- 4. SEMILLA: PROVEEDORES
SET IDENTITY_INSERT Inv_cat_proveedores ON;
INSERT INTO Inv_cat_proveedores (idProveedor, nombre, activo) VALUES 
(1, 'Huawei Technologies Ltd', 1),
(2, 'Corning Fiber Optic Systems', 1),
(3, 'Cisco Systems Inc', 1),
(4, 'Equipos y Herramientas SA', 1);
SET IDENTITY_INSERT Inv_cat_proveedores OFF;

-- 5. SEMILLA: PRODUCTOS
SET IDENTITY_INSERT Inv_cat_productos ON;
INSERT INTO Inv_cat_productos (idProducto, codigo, nombre, unidad, costo, minimoStock, esSerializado, activo) VALUES 
(1, 'FIB-DROP-750', 'Bobina Fibra Drop AR-8 750m', 'METROS', 0.15, 2000, 0, 1),
(2, 'ONT-HWA-EG8145', 'ONT Huawei EG8145V5 Dual Band', 'PIEZA', 45.00, 50, 1, 1),
(3, 'TOOL-FUS-60S', 'Fusionadora Fujikura 60S Pro', 'PIEZA', 4500.00, 1, 1, 1),
(4, 'TOOL-OPM-V10', 'Medidor Potencia (OPM) Pon V10', 'PIEZA', 85.00, 2, 0, 1);
SET IDENTITY_INSERT Inv_cat_productos OFF;

-- 6. SEMILLA: USUARIOS (Alineal con esquema real: correo, password, idRol, carnet)
-- idRol: 1=Admin, 2=Despacho, 3=Tecnico
DECLARE @pwd NVARCHAR(MAX) = '$2b$10$7N3zH9vJ5WpT728qM6/iXOqXqC3z2z8vG9z9z9z9z9z9z9z9z9z9';

SET IDENTITY_INSERT Inv_seg_usuarios ON;
INSERT INTO Inv_seg_usuarios (idUsuario, nombre, correo, carnet, password, idRol, activo) VALUES 
(100, 'Diana Martinez', 'diana.martinez@empresa.com', 'ADM001', @pwd, 1, 1), -- Admin
(110, 'Sofia Lopez', 'sofia.lopez@empresa.com', 'SUP001', @pwd, 2, 1),      -- Supervisor/Despacho
(120, 'Roberto Central', 'roberto.central@empresa.com', 'BOD001', @pwd, 2, 1), -- Bodeguero (Rol Despacho para permisos)
(121, 'Ana Norte', 'ana.norte@empresa.com', 'BOD002', @pwd, 2, 1),
(201, 'Carlos Paredes', 'carlos.paredes@empresa.com', 'TEC001', @pwd, 3, 1),   -- Tecnicos
(202, 'Juan Rodriguez', 'juan.rodriguez@empresa.com', 'TEC002', @pwd, 3, 1),
(203, 'Miguel Torres', 'miguel.torres@empresa.com', 'TEC003', @pwd, 3, 1),
(204, 'Luis Enrique Gomez', 'luis.gomez@empresa.com', 'TEC004', @pwd, 3, 1),
(205, 'Fernando Castro', 'fernando.castro@empresa.com', 'TEC005', @pwd, 3, 1),
(206, 'David Salazar', 'david.salazar@empresa.com', 'TEC006', @pwd, 3, 1);
SET IDENTITY_INSERT Inv_seg_usuarios OFF;

-- 7. SEMILLA: ALMACENES
SET IDENTITY_INSERT Inv_cat_almacenes ON;
INSERT INTO Inv_cat_almacenes (idAlmacen, nombre, tipo, responsableId, activo) VALUES 
(1, 'Bodega Central Valle', 'CENTRAL', 120, 1),
(2, 'Regional Norte', 'REGIONAL', 121, 1);

-- Almacenes de Tecnicos (201-206)
INSERT INTO Inv_cat_almacenes (idAlmacen, nombre, tipo, responsableId, activo) VALUES 
(201, 'Cargo: Carlos Paredes', 'TECNICO', 201, 1),
(202, 'Cargo: Juan Rodriguez', 'TECNICO', 202, 1),
(203, 'Cargo: Miguel Torres', 'TECNICO', 203, 1),
(204, 'Cargo: Luis Enrique Gomez', 'TECNICO', 204, 1),
(205, 'Cargo: Fernando Castro', 'TECNICO', 205, 1),
(206, 'Cargo: David Salazar', 'TECNICO', 206, 1);
SET IDENTITY_INSERT Inv_cat_almacenes OFF;

-- 8. SEMILLA: STOCK Y KARDEX (Integridad total)
PRINT 'Poblando Stock y Kardex...';
DECLARE @idMov INT;
-- Entrada Masiva a Bodega Central
INSERT INTO Inv_inv_movimientos (tipoMovimiento, almacenDestinoId, idUsuarioResponsable, referenciaTexto, fechaMovimiento)
VALUES ('ENTRADA_COMPRA', 1, 120, 'Compra Lote 2026-A', GETDATE());
SET @idMov = SCOPE_IDENTITY();

INSERT INTO Inv_inv_movimiento_detalle (idMovimiento, productoId, cantidad, propietarioTipo, proveedorId, stockNuevo) VALUES 
(@idMov, 1, 100000, 'EMPRESA', 2, 100000),
(@idMov, 2, 200, 'EMPRESA', 1, 200),
(@idMov, 3, 10, 'EMPRESA', 4, 10),
(@idMov, 4, 10, 'EMPRESA', 4, 10);

INSERT INTO Inv_inv_stock (almacenId, productoId, propietarioTipo, proveedorId, cantidad) VALUES 
(1, 1, 'EMPRESA', 2, 100000),
(1, 2, 'EMPRESA', 1, 200),
(1, 3, 'EMPRESA', 4, 10),
(1, 4, 'EMPRESA', 4, 10);

-- Transferencia a Carlos Paredes (ID 201)
DECLARE @idMovT INT;
INSERT INTO Inv_inv_movimientos (tipoMovimiento, almacenOrigenId, almacenDestinoId, idUsuarioResponsable, referenciaTexto, fechaMovimiento)
VALUES ('TRANSFERENCIA', 1, 201, 120, 'Dotacion Inicial Carlos', GETDATE());
SET @idMovT = SCOPE_IDENTITY();

INSERT INTO Inv_inv_movimiento_detalle (idMovimiento, productoId, cantidad, propietarioTipo, proveedorId, stockNuevo) VALUES 
(@idMovT, 1, -500, 'EMPRESA', 2, 99500), -- Sale de central
(@idMovT, 3, -1, 'EMPRESA', 4, 9),      -- Sale de central
(@idMovT, 4, -1, 'EMPRESA', 4, 9);      -- Sale de central

INSERT INTO Inv_inv_movimiento_detalle (idMovimiento, productoId, cantidad, propietarioTipo, proveedorId, stockNuevo) VALUES 
(@idMovT, 1, 500, 'EMPRESA', 2, 500), -- Entra al tecnico
(@idMovT, 3, 1, 'EMPRESA', 4, 1),     -- Entra al tecnico
(@idMovT, 4, 1, 'EMPRESA', 4, 1);     -- Entra al tecnico

UPDATE Inv_inv_stock SET cantidad = 99500 WHERE almacenId = 1 AND productoId = 1;
UPDATE Inv_inv_stock SET cantidad = 9 WHERE almacenId = 1 AND productoId = 3;
UPDATE Inv_inv_stock SET cantidad = 9 WHERE almacenId = 1 AND productoId = 4;

INSERT INTO Inv_inv_stock (almacenId, productoId, propietarioTipo, proveedorId, cantidad) VALUES 
(201, 1, 'EMPRESA', 2, 500),
(201, 3, 'EMPRESA', 4, 1),
(201, 4, 'EMPRESA', 4, 1);

-- 9. PROYECTOS Y TAREAS
SET IDENTITY_INSERT Inv_ope_proyectos ON;
INSERT INTO Inv_ope_proyectos (idProyecto, nombre, descripcion, estado, fechaInicio, idResponsable) VALUES 
(1, 'Expansion FTTH Las Colinas', 'Construccion de red para 500 abonados.', 'EJECUCION', '2026-01-01', 110);
SET IDENTITY_INSERT Inv_ope_proyectos OFF;

SET IDENTITY_INSERT Inv_ope_proyecto_tareas ON;
INSERT INTO Inv_ope_proyecto_tareas (idTarea, idProyecto, nombre, descripcion, orden) VALUES 
(1, 1, 'Fase 1: Tendido ADSS', 'Instalacion de fibra aerea troncal.', 1),
(2, 1, 'Fase 2: Conexion NAP', 'Montaje y conectorizacion de cajas.', 2);
SET IDENTITY_INSERT Inv_ope_proyecto_tareas OFF;

-- 10. oRDENES DE TRABAJO (OT)
INSERT INTO Inv_ope_ot (idProyecto, idTareaWBS, idTecnicoAsignado, clienteNombre, clienteDireccion, tipoOT, prioridad, estado) VALUES 
(1, 1, 201, 'Empresa Textil SA', 'KM 14 Carretera Norte', 'INSTALACION', 'ALTA', 'ASIGNADA');

PRINT '--- DESPLIEGUE COMPLETADO EXITOSAMENTE ---';
GO
