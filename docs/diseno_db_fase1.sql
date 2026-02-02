/*
================================================================================
SCRIPT DE IMPLEMENTACIoN — SISTEMA DE INVENTARIO (PREFIJO Inv_)
FECHA: 2026-01-28
AUTOR: Antigravity (AI)
DESCRIPCIoN: Creacion de estructura base (Seguridad y Catalogos).
================================================================================
*/

-- 1. SEGURIDAD
IF OBJECT_ID('Inv_seg_roles', 'U') IS NULL
CREATE TABLE Inv_seg_roles (
    idRol INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(50) NOT NULL UNIQUE,
    descripcion NVARCHAR(200),
    reglas NVARCHAR(MAX) DEFAULT '[]', -- JSON con permisos especificos
    activo BIT DEFAULT 1,
    fechaCreacion DATETIME DEFAULT GETDATE(),
    actualizadoPor INT
);

IF OBJECT_ID('Inv_seg_usuarios', 'U') IS NULL
CREATE TABLE Inv_seg_usuarios (
    idUsuario INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100) NOT NULL,
    correo NVARCHAR(100) NOT NULL UNIQUE,
    carnet NVARCHAR(20) NOT NULL UNIQUE,
    password NVARCHAR(MAX) NOT NULL,
    idRol INT REFERENCES Inv_seg_roles(idRol),
    idAlmacenTecnico INT NULL, -- FK posterior a Inv_cat_almacenes
    activo BIT DEFAULT 1,
    fechaCreacion DATETIME DEFAULT GETDATE(),
    ultimoAcceso DATETIME
);

IF OBJECT_ID('Inv_seg_refresh_tokens', 'U') IS NULL
CREATE TABLE Inv_seg_refresh_tokens (
    idToken INT IDENTITY(1,1) PRIMARY KEY,
    idUsuario INT NOT NULL REFERENCES Inv_seg_usuarios(idUsuario),
    token NVARCHAR(500) NOT NULL,
    expira DATETIME NOT NULL,
    creado DATETIME DEFAULT GETDATE(),
    revocado DATETIME NULL
);

-- 2. CATaLOGOS BASE
IF OBJECT_ID('Inv_cat_proveedores', 'U') IS NULL
CREATE TABLE Inv_cat_proveedores (
    idProveedor INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(150) NOT NULL,
    nit NVARCHAR(50),
    contacto NVARCHAR(100),
    telefono NVARCHAR(50),
    correo NVARCHAR(100),
    activo BIT DEFAULT 1,
    fechaCreacion DATETIME DEFAULT GETDATE()
);

IF OBJECT_ID('Inv_cat_categorias_producto', 'U') IS NULL
CREATE TABLE Inv_cat_categorias_producto (
    idCategoria INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100) NOT NULL,
    descripcion NVARCHAR(250),
    activo BIT DEFAULT 1
);

IF OBJECT_ID('Inv_cat_productos', 'U') IS NULL
CREATE TABLE Inv_cat_productos (
    idProducto INT IDENTITY(1,1) PRIMARY KEY,
    codigo NVARCHAR(50) NOT NULL UNIQUE,
    nombre NVARCHAR(200) NOT NULL,
    idCategoria INT REFERENCES Inv_cat_categorias_producto(idCategoria),
    unidad NVARCHAR(20) DEFAULT 'unidades',
    esSerializado BIT DEFAULT 0,
    costo DECIMAL(18,2) DEFAULT 0,
    minimoStock INT DEFAULT 0,
    activo BIT DEFAULT 1,
    fechaCreacion DATETIME DEFAULT GETDATE()
);

IF OBJECT_ID('Inv_cat_almacenes', 'U') IS NULL
CREATE TABLE Inv_cat_almacenes (
    idAlmacen INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100) NOT NULL,
    idPadre INT NULL REFERENCES Inv_cat_almacenes(idAlmacen),
    tipo NVARCHAR(20) NOT NULL, -- CENTRAL, REGIONAL, PROYECTO, TECNICO
    responsableId INT NULL REFERENCES Inv_seg_usuarios(idUsuario),
    ubicacion NVARCHAR(200),
    activo BIT DEFAULT 1,
    fechaCreacion DATETIME DEFAULT GETDATE()
);

-- TIPOS DE OT CON REGLAS
IF OBJECT_ID('Inv_cat_tipos_ot', 'U') IS NULL
CREATE TABLE Inv_cat_tipos_ot (
    idTipoOT INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(50) NOT NULL UNIQUE,
    requiereFirma BIT DEFAULT 1,
    requiereEvidencia BIT DEFAULT 1,
    requiereEquipoSerializado BIT DEFAULT 0,
    slaHoras INT DEFAULT 24, -- Tiempo maximo de resolucion
    activo BIT DEFAULT 1
);

-- 3. INVENTARIO CORE (STOCK)
IF OBJECT_ID('Inv_inv_stock', 'U') IS NULL
CREATE TABLE Inv_inv_stock (
    almacenId INT NOT NULL REFERENCES Inv_cat_almacenes(idAlmacen),
    productoId INT NOT NULL REFERENCES Inv_cat_productos(idProducto),
    propietarioTipo NVARCHAR(20) DEFAULT 'EMPRESA', -- EMPRESA / PROVEEDOR
    proveedorId INT NOT NULL DEFAULT 0, -- 0 si es EMPRESA, REFERENCES Inv_cat_proveedores(idProveedor)
    cantidad DECIMAL(18,2) NOT NULL DEFAULT 0,
    PRIMARY KEY (almacenId, productoId, propietarioTipo, proveedorId)
);

-- 4. MOVIMIENTOS Y KARDEX
IF OBJECT_ID('Inv_inv_transferencias', 'U') IS NULL
CREATE TABLE Inv_inv_transferencias (
    idTransferencia INT IDENTITY(1,1) PRIMARY KEY,
    almacenOrigenId INT NOT NULL REFERENCES Inv_cat_almacenes(idAlmacen),
    almacenDestinoId INT NOT NULL REFERENCES Inv_cat_almacenes(idAlmacen),
    idUsuarioEnvia INT NOT NULL REFERENCES Inv_seg_usuarios(idUsuario),
    idUsuarioRecibe INT NULL REFERENCES Inv_seg_usuarios(idUsuario), -- Quien confirma
    fechaEnvio DATETIME DEFAULT GETDATE(),
    fechaRecepcion DATETIME NULL,
    estado NVARCHAR(20) DEFAULT 'EN_TRANSITO', -- EN_TRANSITO, COMPLETADA, CANCELADA
    notas NVARCHAR(MAX)
);

IF OBJECT_ID('Inv_inv_transferencia_detalle', 'U') IS NULL
CREATE TABLE Inv_inv_transferencia_detalle (
    idDetalle INT IDENTITY(1,1) PRIMARY KEY,
    idTransferencia INT NOT NULL REFERENCES Inv_inv_transferencias(idTransferencia),
    productoId INT NOT NULL REFERENCES Inv_cat_productos(idProducto),
    cantidadEnviada DECIMAL(18,2) NOT NULL,
    cantidadRecibida DECIMAL(18,2) NULL
);

IF OBJECT_ID('Inv_inv_movimientos', 'U') IS NULL
CREATE TABLE Inv_inv_movimientos (
    idMovimiento INT IDENTITY(1,1) PRIMARY KEY,
    tipoMovimiento NVARCHAR(50) NOT NULL, -- ENTRADA_COMPRA, TRANSFERENCIA, CONSUMO_OT, AJUSTE, etc.
    almacenOrigenId INT NULL REFERENCES Inv_cat_almacenes(idAlmacen),
    almacenDestinoId INT NULL REFERENCES Inv_cat_almacenes(idAlmacen),
    idDocumentoReferencia INT NULL, -- ID de OT, Traslado, etc.
    tipoDocumentoReferencia NVARCHAR(50) NULL,
    referenciaTexto NVARCHAR(100) NULL,
    notas NVARCHAR(MAX),
    fechaMovimiento DATETIME DEFAULT GETDATE(),
    idUsuarioResponsable INT NOT NULL REFERENCES Inv_seg_usuarios(idUsuario),
    estado NVARCHAR(20) DEFAULT 'APLICADO' -- APLICADO, PENDIENTE, CANCELADO
);

IF OBJECT_ID('Inv_inv_movimiento_detalle', 'U') IS NULL
CREATE TABLE Inv_inv_movimiento_detalle (
    idDetalle INT IDENTITY(1,1) PRIMARY KEY,
    idMovimiento INT NOT NULL REFERENCES Inv_inv_movimientos(idMovimiento),
    productoId INT NOT NULL REFERENCES Inv_cat_productos(idProducto),
    propietarioTipo NVARCHAR(20) DEFAULT 'EMPRESA',
    proveedorId INT NOT NULL DEFAULT 0,
    cantidad DECIMAL(18,2) NOT NULL,
    costoUnitario DECIMAL(18,2) DEFAULT 0,
    stockAnterior DECIMAL(18,2) DEFAULT 0,
    stockNuevo DECIMAL(18,2) DEFAULT 0
);

-- PROCEDIMIENTO: CREAR CABECERA DE MOVIMIENTO
GO
CREATE OR ALTER PROCEDURE Inv_sp_inv_movimiento_crear_header
    @tipoMovimiento NVARCHAR(50),
    @almacenOrigenId INT = NULL,
    @almacenDestinoId INT = NULL,
    @idUsuarioResponsable INT,
    @notas NVARCHAR(MAX) = NULL,
    @referenciaTexto NVARCHAR(100) = NULL
AS
BEGIN
    INSERT INTO Inv_inv_movimientos (
        tipoMovimiento, almacenOrigenId, almacenDestinoId, 
        idUsuarioResponsable, notas, referenciaTexto, fechaMovimiento, estado
    )
    OUTPUT INSERTED.idMovimiento
    VALUES (
        @tipoMovimiento, @almacenOrigenId, @almacenDestinoId, 
        @idUsuarioResponsable, @notas, @referenciaTexto, GETDATE(), 'APLICADO'
    );
END
GO

-- PROCEDIMIENTO: PROCESAR iTEM DE MOVIMIENTO (ACTUALIZA STOCK Y KARDEX)
GO
CREATE OR ALTER PROCEDURE Inv_sp_inv_movimiento_procesar_item
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
CREATE OR ALTER PROCEDURE Inv_sp_inv_stock_obtener
    @almacenId INT = NULL,
    @productoId INT = NULL,
    @buscar NVARCHAR(100) = NULL
AS
BEGIN
    SELECT 
        s.almacenId,
        a.nombre AS almacenNombre,
        s.productoId,
        p.nombre AS productoNombre,
        p.codigo AS productoCodigo,
        s.propietarioTipo,
        prov.nombre AS proveedorNombre,
        s.cantidad,
        p.unidad
    FROM Inv_inv_stock s
    JOIN Inv_cat_almacenes a ON s.almacenId = a.idAlmacen
    JOIN Inv_cat_productos p ON s.productoId = p.idProducto
    LEFT JOIN Inv_cat_proveedores prov ON s.proveedorId = prov.idProveedor
    WHERE (@almacenId IS NULL OR s.almacenId = @almacenId)
      AND (@productoId IS NULL OR s.productoId = @productoId)
      AND (@buscar IS NULL OR p.nombre LIKE '%' + @buscar + '%' OR p.codigo LIKE '%' + @buscar + '%')
END
GO

-- PROCEDIMIENTO: OBTENER KARDEX DETALLADO
GO
CREATE OR ALTER PROCEDURE Inv_sp_inv_kardex_obtener
    @almacenId INT,
    @productoId INT,
    @fechaInicio DATETIME = NULL,
    @fechaFin DATETIME = NULL
AS
BEGIN
    SELECT 
        m.idMovimiento,
        m.tipoMovimiento,
        m.fechaMovimiento,
        m.referenciaTexto,
        d.cantidad,
        d.stockAnterior,
        d.stockNuevo,
        u.nombre AS usuarioResponsable
    FROM Inv_inv_movimientos m
    JOIN Inv_inv_movimiento_detalle d ON m.idMovimiento = d.idMovimiento
    JOIN Inv_seg_usuarios u ON m.idUsuarioResponsable = u.idUsuario
    WHERE d.productoId = @productoId
      AND (m.almacenOrigenId = @almacenId OR m.almacenDestinoId = @almacenId)
      AND (@fechaInicio IS NULL OR m.fechaMovimiento >= @fechaInicio)
      AND (@fechaFin IS NULL OR m.fechaMovimiento <= @fechaFin)
    ORDER BY m.fechaMovimiento DESC
END
GO

-- 5. PROYECTOS Y oRDENES DE TRABAJO (OT)
IF OBJECT_ID('Inv_ope_proyectos', 'U') IS NULL
CREATE TABLE Inv_ope_proyectos (
    idProyecto INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(150) NOT NULL,
    descripcion NVARCHAR(MAX),
    estado NVARCHAR(20) DEFAULT 'PLANIFICADO', -- PLANIFICADO, EJECUCION, FINALIZADO, CANCELADO
    fechaInicio DATETIME,
    fechaFin DATETIME,
    idResponsable INT NULL REFERENCES Inv_seg_usuarios(idUsuario),
    idAlmacenProyecto INT NULL REFERENCES Inv_cat_almacenes(idAlmacen),
    fechaCreacion DATETIME DEFAULT GETDATE()
);

IF OBJECT_ID('Inv_ope_ot', 'U') IS NULL
CREATE TABLE Inv_ope_ot (
    idOT INT IDENTITY(1,1) PRIMARY KEY,
    idProyecto INT NULL REFERENCES Inv_ope_proyectos(idProyecto),
    idTecnicoAsignado INT NULL REFERENCES Inv_seg_usuarios(idUsuario),
    clienteNombre NVARCHAR(150),
    clienteDireccion NVARCHAR(MAX),
    tipoOT NVARCHAR(50), -- INSTALACION, MANTENIMIENTO, REPARACION
    prioridad NVARCHAR(20) DEFAULT 'MEDIA',
    estado NVARCHAR(20) DEFAULT 'REGISTRADA', -- REGISTRADA, ASIGNADA, PROCESO, FINALIZADA, CANCELADA
    fechaAsignacion DATETIME,
    fechaInicio DATETIME,
    fechaCierre DATETIME,
    notas NVARCHAR(MAX),
    fechaCreacion DATETIME DEFAULT GETDATE()
);

-- CONSUMO DE MATERIALES EN OT
IF OBJECT_ID('Inv_ope_ot_consumo', 'U') IS NULL
CREATE TABLE Inv_ope_ot_consumo (
    idConsumo INT IDENTITY(1,1) PRIMARY KEY,
    idOT INT NOT NULL REFERENCES Inv_ope_ot(idOT),
    productoId INT NOT NULL REFERENCES Inv_cat_productos(idProducto),
    cantidad DECIMAL(18,2) NOT NULL,
    idMovimientoInventario INT NULL REFERENCES Inv_inv_movimientos(idMovimiento), -- Vinculo con Kardex
    fechaConsumo DATETIME DEFAULT GETDATE()
);

-- EVIDENCIAS Y FIRMAS
IF OBJECT_ID('Inv_ope_ot_evidencias', 'U') IS NULL
CREATE TABLE Inv_ope_ot_evidencias (
    idEvidencia INT IDENTITY(1,1) PRIMARY KEY,
    idOT INT NOT NULL REFERENCES Inv_ope_ot(idOT),
    tipoEvidencia NVARCHAR(20), -- FOTO_ANTES, FOTO_DESPUES, DOCUMENTO
    urlArchivo NVARCHAR(MAX),
    fechaCarga DATETIME DEFAULT GETDATE()
);

IF OBJECT_ID('Inv_ope_ot_firmas', 'U') IS NULL
CREATE TABLE Inv_ope_ot_firmas (
    idOT INT PRIMARY KEY REFERENCES Inv_ope_ot(idOT),
    nombreFirmante NVARCHAR(100),
    dniFirmante NVARCHAR(20),
    urlFirma NVARCHAR(MAX),
    fechaFirma DATETIME DEFAULT GETDATE()
);

-- PROCEDIMEINTO: CREAR OT
GO
CREATE OR ALTER PROCEDURE Inv_sp_ot_crear
    @idProyecto INT = NULL,
    @clienteNombre NVARCHAR(150),
    @clienteDireccion NVARCHAR(MAX),
    @tipoOT NVARCHAR(50),
    @prioridad NVARCHAR(20) = 'MEDIA',
    @notas NVARCHAR(MAX) = NULL
AS
BEGIN
    INSERT INTO Inv_ope_ot (idProyecto, clienteNombre, clienteDireccion, tipoOT, prioridad, notas)
    OUTPUT INSERTED.idOT
    VALUES (@idProyecto, @clienteNombre, @clienteDireccion, @tipoOT, @prioridad, @notas);
END
GO

-- PROCEDIMIENTO: LISTAR PROYECTOS
GO
CREATE OR ALTER PROCEDURE Inv_sp_proyectos_listar
    @buscar NVARCHAR(100) = NULL
AS
BEGIN
    SELECT * FROM Inv_ope_proyectos
    WHERE (@buscar IS NULL OR nombre LIKE '%' + @buscar + '%' OR descripcion LIKE '%' + @buscar + '%')
    ORDER BY fechaCreacion DESC
END
GO

-- PROCEDIMIENTO: REGISTRAR CONSUMO EN OT
GO
CREATE OR ALTER PROCEDURE Inv_sp_ot_consumo_registrar
    @idOT INT,
    @productoId INT,
    @cantidad DECIMAL(18,2),
    @idMovimientoInventario INT
AS
BEGIN
    INSERT INTO Inv_ope_ot_consumo (idOT, productoId, cantidad, idMovimientoInventario)
    VALUES (@idOT, @productoId, @cantidad, @idMovimientoInventario);
END
GO

-- 6. ACTIVOS SERIALIZADOS (EQUIPOS Y HERRAMIENTAS)
IF OBJECT_ID('Inv_act_activos', 'U') IS NULL
CREATE TABLE Inv_act_activos (
    idActivo INT IDENTITY(1,1) PRIMARY KEY,
    serial NVARCHAR(50) NOT NULL UNIQUE,
    idProducto INT NOT NULL REFERENCES Inv_cat_productos(idProducto), -- Vincula al catalogo
    estado NVARCHAR(20) DEFAULT 'DISPONIBLE', -- DISPONIBLE, ASIGNADO, INSTALADO, REPARACION, DANIADO, BAJA
    idAlmacenActual INT NULL REFERENCES Inv_cat_almacenes(idAlmacen),
    idTecnicoActual INT NULL REFERENCES Inv_seg_usuarios(idUsuario),
    idClienteActual INT NULL, -- Referencia a cliente externo si esta instalado
    fechaIngreso DATETIME DEFAULT GETDATE(),
    notas NVARCHAR(MAX)
);

-- HISTORIAL DE MOVIMIENTOS DEL ACTIVO
IF OBJECT_ID('Inv_act_movimientos', 'U') IS NULL
CREATE TABLE Inv_act_movimientos (
    idMovimiento INT IDENTITY(1,1) PRIMARY KEY,
    idActivo INT NOT NULL REFERENCES Inv_act_activos(idActivo),
    tipoMovimiento NVARCHAR(50), -- ASIGNACION, DEVOLUCION, INSTALACION, RETIRO, REPARACION
    idUsuarioResponsable INT NOT NULL REFERENCES Inv_seg_usuarios(idUsuario),
    almacenAnteriorId INT NULL REFERENCES Inv_cat_almacenes(idAlmacen),
    almacenNuevoId INT NULL REFERENCES Inv_cat_almacenes(idAlmacen),
    tecnicoAnteriorId INT NULL REFERENCES Inv_seg_usuarios(idUsuario),
    tecnicoNuevoId INT NULL REFERENCES Inv_seg_usuarios(idUsuario),
    fechaMovimiento DATETIME DEFAULT GETDATE(),
    notas NVARCHAR(MAX)
);

-- REPARACIONES DE ACTIVOS
IF OBJECT_ID('Inv_act_reparaciones', 'U') IS NULL
CREATE TABLE Inv_act_reparaciones (
    idReparacion INT IDENTITY(1,1) PRIMARY KEY,
    idActivo INT NOT NULL REFERENCES Inv_act_activos(idActivo),
    fechaEnvio DATETIME DEFAULT GETDATE(),
    fechaRetorno DATETIME NULL,
    diagnostico NVARCHAR(MAX),
    resultado NVARCHAR(50), -- REPARADO, NO_REPARABLE
    costoReparacion DECIMAL(18,2) DEFAULT 0,
    enviadoPor INT REFERENCES Inv_seg_usuarios(idUsuario)
);

-- PROCEDIMIENTO: ASIGNAR ACTIVO A TeCNICO
GO
CREATE OR ALTER PROCEDURE Inv_sp_activo_asignar_tecnico
    @idActivo INT,
    @idTecnico INT,
    @idUsuarioResponsable INT,
    @notas NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @almacenOrig INT, @almacenDest INT, @tecnicoOrig INT;

    -- Obtener estado actual
    SELECT @almacenOrig = idAlmacenActual, @tecnicoOrig = idTecnicoActual FROM Inv_act_activos WHERE idActivo = @idActivo;
    
    -- Obtener almacen del tecnico destino
    SELECT @almacenDest = idAlmacenTecnico FROM Inv_seg_usuarios WHERE idUsuario = @idTecnico;

    BEGIN TRANSACTION
    BEGIN TRY
        -- 1. Actualizar estado del activo
        UPDATE Inv_act_activos 
        SET estado = 'ASIGNADO', 
            idTecnicoActual = @idTecnico, 
            idAlmacenActual = @almacenDest
        WHERE idActivo = @idActivo;

        -- 2. Registrar historial
        INSERT INTO Inv_act_movimientos (
            idActivo, tipoMovimiento, idUsuarioResponsable, 
            almacenAnteriorId, almacenNuevoId, 
            tecnicoAnteriorId, tecnicoNuevoId, notas
        )
        VALUES (
            @idActivo, 'ASIGNACION', @idUsuarioResponsable, 
            @almacenOrig, @almacenDest, 
            @tecnicoOrig, @idTecnico, @notas
        );

        COMMIT TRANSACTION
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- PROCEDIMIENTO: LISTAR ACTIVOS
GO
CREATE OR ALTER PROCEDURE Inv_sp_activos_listar
    @estado NVARCHAR(20) = NULL,
    @idAlmacen INT = NULL,
    @idTecnico INT = NULL,
    @buscar NVARCHAR(100) = NULL
AS
BEGIN
    SELECT 
        a.*,
        p.nombre AS productoNombre,
        p.codigo AS productoCodigo,
        alm.nombre AS almacenNombre,
        u.nombre AS tecnicoNombre
    FROM Inv_act_activos a
    JOIN Inv_cat_productos p ON a.idProducto = p.idProducto
    LEFT JOIN Inv_cat_almacenes alm ON a.idAlmacenActual = alm.idAlmacen
    LEFT JOIN Inv_seg_usuarios u ON a.idTecnicoActual = u.idUsuario
    WHERE (@estado IS NULL OR a.estado = @estado)
      AND (@idAlmacen IS NULL OR a.idAlmacenActual = @idAlmacen)
      AND (@idTecnico IS NULL OR a.idTecnicoActual = @idTecnico)
      AND (@buscar IS NULL OR a.serial LIKE '%' + @buscar + '%' OR p.nombre LIKE '%' + @buscar + '%')
END
GO

-- PROCEDIMIENTO: INSTALAR ACTIVO EN CLIENTE
GO
CREATE OR ALTER PROCEDURE Inv_sp_activo_instalar
    @idActivo INT,
    @idCliente INT,
    @idOT INT,
    @idUsuarioResponsable INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @almacenOrig INT, @tecnicoOrig INT;

    SELECT @almacenOrig = idAlmacenActual, @tecnicoOrig = idTecnicoActual FROM Inv_act_activos WHERE idActivo = @idActivo;

    BEGIN TRANSACTION
    BEGIN TRY
        -- 1. Actualizar activo
        UPDATE Inv_act_activos 
        SET estado = 'INSTALADO', 
            idAlmacenActual = NULL, 
            idTecnicoActual = NULL, 
            idClienteActual = @idCliente
        WHERE idActivo = @idActivo;

        -- 2. Registrar en la OT el activo instalado
        -- Nota: Esta tabla debe existir en el esquema de OPE
        IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Inv_ope_ot_activos')
        BEGIN
             CREATE TABLE Inv_ope_ot_activos (
                id INT IDENTITY(1,1) PRIMARY KEY,
                idOT INT NOT NULL REFERENCES Inv_ope_ot(idOT),
                idActivo INT NOT NULL REFERENCES Inv_act_activos(idActivo),
                tipoAccion NVARCHAR(20), -- INSTALADO, RETIRADO
                fecha DATETIME DEFAULT GETDATE()
             );
        END

        INSERT INTO Inv_ope_ot_activos (idOT, idActivo, tipoAccion)
        VALUES (@idOT, @idActivo, 'INSTALADO');

        -- 3. Historial del activo
        INSERT INTO Inv_act_movimientos (idActivo, tipoMovimiento, idUsuarioResponsable, almacenAnteriorId, tecnicoAnteriorId, notas)
        VALUES (@idActivo, 'INSTALACION', @idUsuarioResponsable, @almacenOrig, @tecnicoOrig, 'Instalado via OT #' + CAST(@idOT AS NVARCHAR(10)));

        COMMIT TRANSACTION
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- PROCEDIMIENTO: ENVIAR TRANSFERENCIA (RESTA STOCK ORIGEN)
GO
CREATE OR ALTER PROCEDURE Inv_sp_inv_transferencia_enviar
    @almacenOrigenId INT,
    @almacenDestinoId INT,
    @idUsuarioEnvia INT,
    @notas NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Inv_inv_transferencias (almacenOrigenId, almacenDestinoId, idUsuarioEnvia, fechaEnvio, estado, notas)
    OUTPUT INSERTED.idTransferencia
    VALUES (@almacenOrigenId, @almacenDestinoId, @idUsuarioEnvia, GETDATE(), 'EN_TRANSITO', @notas);
END
GO

-- PROCEDIMIENTO: PROCESAR iTEM DE TRANSFERENCIA (ENVIAR)
GO
CREATE OR ALTER PROCEDURE Inv_sp_inv_transferencia_item_enviar
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
    VALUES ('ENVIO_TRANSFERENCIA', @almacenOrig, @idUsuario, 'Envio TR #' + CAST(@idTransferencia AS NVARCHAR(10)), GETDATE(), 'APLICADO');
    SET @idMov = SCOPE_IDENTITY();

    -- Restar Stock y crear detalle movimiento
    UPDATE Inv_inv_stock SET cantidad = cantidad - @cantidad WHERE almacenId = @almacenOrig AND productoId = @productoId;
    
    INSERT INTO Inv_inv_movimiento_detalle (idMovimiento, productoId, cantidad, stockAnterior, stockNuevo)
    SELECT @idMov, @productoId, -@cantidad, cantidad + @cantidad, cantidad FROM Inv_inv_stock WHERE almacenId = @almacenOrig AND productoId = @productoId;
END
GO

-- PROCEDIMIENTO: CONFIRMAR RECEPCIoN DE TRANSFERENCIA
GO
CREATE OR ALTER PROCEDURE Inv_sp_inv_transferencia_confirmar
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

        -- 2. Procesar cada item del detalle para sumarlo al stock destino
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

-- 7. AUDITORiA Y REPORTES
IF OBJECT_ID('Inv_inv_ajustes', 'U') IS NULL
CREATE TABLE Inv_inv_ajustes (
    idAjuste INT IDENTITY(1,1) PRIMARY KEY,
    almacenId INT NOT NULL REFERENCES Inv_cat_almacenes(idAlmacen),
    productoId INT NOT NULL REFERENCES Inv_cat_productos(idProducto),
    cantidadAnterior DECIMAL(18,2),
    cantidadNueva DECIMAL(18,2),
    motivo NVARCHAR(MAX),
    idUsuario INT NOT NULL REFERENCES Inv_seg_usuarios(idUsuario),
    fechaAjuste DATETIME DEFAULT GETDATE()
);

-- PROCEDIMIENTO: AJUSTE MANUAL DE STOCK
GO
CREATE OR ALTER PROCEDURE Inv_sp_inv_stock_ajustar
    @almacenId INT,
    @productoId INT,
    @nuevaCantidad DECIMAL(18,2),
    @motivo NVARCHAR(MAX),
    @idUsuario INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @cantAnt DECIMAL(18,2);
    SELECT @cantAnt = ISNULL(cantidad, 0) FROM Inv_inv_stock WITH (UPDLOCK) WHERE almacenId = @almacenId AND productoId = @productoId;

    BEGIN TRANSACTION
    BEGIN TRY
        -- 1. Actualizar/Insertar Stock
        IF EXISTS (SELECT 1 FROM Inv_inv_stock WHERE almacenId = @almacenId AND productoId = @productoId)
            UPDATE Inv_inv_stock SET cantidad = @nuevaCantidad WHERE almacenId = @almacenId AND productoId = @productoId;
        ELSE
            INSERT INTO Inv_inv_stock (almacenId, productoId, cantidad) VALUES (@almacenId, @productoId, @nuevaCantidad);

        -- 2. Registrar Ajuste
        INSERT INTO Inv_inv_ajustes (almacenId, productoId, cantidadAnterior, cantidadNueva, motivo, idUsuario)
        VALUES (@almacenId, @productoId, @cantAnt, @nuevaCantidad, @motivo, @idUsuario);

        -- 3. Registrar Movimiento (Kardex)
        DECLARE @idMov INT;
        INSERT INTO Inv_inv_movimientos (tipoMovimiento, almacenOrigenId, idUsuarioResponsable, notas, referenciaTexto)
        VALUES ('AJUSTE_MANUAL', @almacenId, @idUsuario, @motivo, 'Ajuste Manual');
        SET @idMov = SCOPE_IDENTITY();

        INSERT INTO Inv_inv_movimiento_detalle (idMovimiento, productoId, cantidad, stockAnterior, stockNuevo)
        VALUES (@idMov, @productoId, @nuevaCantidad - @cantAnt, @cantAnt, @nuevaCantidad);

        COMMIT TRANSACTION
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- REPORTE: CONSUMO POR PROYECTO
GO
CREATE OR ALTER PROCEDURE Inv_sp_repo_consumo_por_proyecto
    @idProyecto INT = NULL,
    @fechaInicio DATETIME = NULL,
    @fechaFin DATETIME = NULL
AS
BEGIN
    SELECT 
        p.nombre AS proyecto,
        prod.nombre AS producto,
        prod.codigo,
        SUM(c.cantidad) AS totalConsumido,
        prod.unidad,
        COUNT(DISTINCT c.idOT) AS numOTsAfectadas
    FROM Inv_ope_ot_consumo c
    JOIN Inv_ope_ot ot ON c.idOT = ot.idOT
    JOIN Inv_ope_proyectos p ON ot.idProyecto = p.idProyecto
    JOIN Inv_cat_productos prod ON c.productoId = prod.idProducto
    WHERE (@idProyecto IS NULL OR p.idProyecto = @idProyecto)
      AND (@fechaInicio IS NULL OR c.fechaConsumo >= @fechaInicio)
      AND (@fechaFin IS NULL OR c.fechaConsumo <= @fechaFin)
    GROUP BY p.nombre, prod.nombre, prod.codigo, prod.unidad
    ORDER BY p.nombre, totalConsumido DESC
END
GO

-- PROCEDIMIENTO: ENVIAR ACTIVO A REPARACIoN
GO
CREATE OR ALTER PROCEDURE Inv_sp_activo_enviar_reparacion
    @idActivo INT,
    @diagnostico NVARCHAR(MAX),
    @idUsuario INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @almacenOrig INT;
    SELECT @almacenOrig = idAlmacenActual FROM Inv_act_activos WHERE idActivo = @idActivo;

    BEGIN TRANSACTION
    BEGIN TRY
        -- 1. Actualizar Activo
        UPDATE Inv_act_activos 
        SET estado = 'REPARACION'
        WHERE idActivo = @idActivo;

        -- 2. Registrar en Reparaciones
        INSERT INTO Inv_act_reparaciones (idActivo, diagnostico, enviadoPor, fechaEnvio)
        VALUES (@idActivo, @diagnostico, @idUsuario, GETDATE());

        -- 3. Historial
        INSERT INTO Inv_act_movimientos (idActivo, tipoMovimiento, idUsuarioResponsable, almacenAnteriorId, notas)
        VALUES (@idActivo, 'REPARACION', @idUsuario, @almacenOrig, @diagnostico);

        COMMIT TRANSACTION
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- 8. CONTEO FiSICO (AUDITORiA DE STOCK)
IF OBJECT_ID('Inv_inv_conteos_cabecera', 'U') IS NULL
CREATE TABLE Inv_inv_conteos_cabecera (
    idConteo INT IDENTITY(1,1) PRIMARY KEY,
    almacenId INT NOT NULL REFERENCES Inv_cat_almacenes(idAlmacen),
    idUsuarioInicia INT NOT NULL REFERENCES Inv_seg_usuarios(idUsuario),
    fechaInicio DATETIME DEFAULT GETDATE(),
    fechaFin DATETIME NULL,
    estado NVARCHAR(20) DEFAULT 'ABIERTO', -- ABIERTO, FINALIZADO, CANCELADO
    notas NVARCHAR(MAX)
);

IF OBJECT_ID('Inv_inv_conteos_detalle', 'U') IS NULL
CREATE TABLE Inv_inv_conteos_detalle (
    idDetalle INT IDENTITY(1,1) PRIMARY KEY,
    idConteo INT NOT NULL REFERENCES Inv_inv_conteos_cabecera(idConteo),
    productoId INT NOT NULL REFERENCES Inv_cat_productos(idProducto),
    stockSistema DECIMAL(18,2),
    stockFisico DECIMAL(18,2),
    diferencia AS (stockFisico - stockSistema)
);

-- PROCEDIMIENTO: INICIAR CONTEO
GO
CREATE OR ALTER PROCEDURE Inv_sp_conteo_iniciar
    @almacenId INT,
    @idUsuario INT,
    @notas NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    -- No permitir mas de un conteo abierto por almacen
    IF EXISTS (SELECT 1 FROM Inv_inv_conteos_cabecera WHERE almacenId = @almacenId AND estado = 'ABIERTO')
        THROW 50000, 'Ya existe un conteo abierto para este almacen.', 1;

    INSERT INTO Inv_inv_conteos_cabecera (almacenId, idUsuarioInicia, notas)
    OUTPUT INSERTED.idConteo
    VALUES (@almacenId, @idUsuario, @notas);
END
GO

-- PROCEDIMIENTO: FINALIZAR CONTEO (APLICAR AJUSTES)
GO
CREATE OR ALTER PROCEDURE Inv_sp_conteo_finalizar
    @idConteo INT,
    @idUsuario INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @almacenId INT;
    SELECT @almacenId = almacenId FROM Inv_inv_conteos_cabecera WHERE idConteo = @idConteo;

    BEGIN TRANSACTION
    BEGIN TRY
        -- 1. Cerrar Cabecera
        UPDATE Inv_inv_conteos_cabecera 
        SET estado = 'FINALIZADO', fechaFin = GETDATE() 
        WHERE idConteo = @idConteo;

        -- 2. Aplicar ajustes por cada diferencia
        DECLARE @prodId INT, @sist DECIMAL(18,2), @fisico DECIMAL(18,2);
        DECLARE cur CURSOR FOR 
            SELECT productoId, stockSistema, stockFisico 
            FROM Inv_inv_conteos_detalle 
            WHERE idConteo = @idConteo AND stockSistema <> stockFisico;
        
        OPEN cur;
        FETCH NEXT FROM cur INTO @prodId, @sist, @fisico;
        WHILE @@FETCH_STATUS = 0
        BEGIN
            EXEC Inv_sp_inv_stock_ajustar @almacenId, @prodId, @fisico, 'Ajuste por Diferencia de Conteo', @idUsuario;
            FETCH NEXT FROM cur INTO @prodId, @sist, @fisico;
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

-- PROCEDIMIENTO: REGISTRAR iTEM EN CONTEO
GO
CREATE OR ALTER PROCEDURE Inv_sp_conteo_registrar_item
    @idConteo INT,
    @productoId INT,
    @stockFisico DECIMAL(18,2)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @almacenId INT, @stockSistema DECIMAL(18,2);
    SELECT @almacenId = almacenId FROM Inv_inv_conteos_cabecera WHERE idConteo = @idConteo;
    
    -- Obtener stock actual del sistema
    SELECT @stockSistema = ISNULL(cantidad, 0) FROM Inv_inv_stock WHERE almacenId = @almacenId AND productoId = @productoId;

    IF EXISTS (SELECT 1 FROM Inv_inv_conteos_detalle WHERE idConteo = @idConteo AND productoId = @productoId)
        UPDATE Inv_inv_conteos_detalle SET stockFisico = @stockFisico, stockSistema = @stockSistema WHERE idConteo = @idConteo AND productoId = @productoId;
    ELSE
        INSERT INTO Inv_inv_conteos_detalle (idConteo, productoId, stockSistema, stockFisico)
        VALUES (@idConteo, @productoId, @stockSistema, @stockFisico);
END
GO

-- 9. CONSIGNACIoN (LIQUIDACIONES)
IF OBJECT_ID('Inv_inv_liquidacion_consignacion', 'U') IS NULL
CREATE TABLE Inv_inv_liquidacion_consignacion (
    idLiquidacion INT IDENTITY(1,1) PRIMARY KEY,
    proveedorId INT NOT NULL REFERENCES Inv_cat_proveedores(idProveedor),
    idUsuarioResponsable INT NOT NULL REFERENCES Inv_seg_usuarios(idUsuario),
    fechaLiquidacion DATETIME DEFAULT GETDATE(),
    totalPagar DECIMAL(18,2) DEFAULT 0,
    estado NVARCHAR(20) DEFAULT 'PENDIENTE', -- PENDIENTE, PAGADA, CANCELADA
    notas NVARCHAR(MAX)
);

IF OBJECT_ID('Inv_inv_liquidacion_consignacion_det', 'U') IS NULL
CREATE TABLE Inv_inv_liquidacion_consignacion_det (
    idDetalle INT IDENTITY(1,1) PRIMARY KEY,
    idLiquidacion INT NOT NULL REFERENCES Inv_inv_liquidacion_consignacion(idLiquidacion),
    productoId INT NOT NULL REFERENCES Inv_cat_productos(idProducto),
    cantidadLiquidada DECIMAL(18,2) NOT NULL,
    precioUnitario DECIMAL(18,2) NOT NULL,
    subtotal AS (cantidadLiquidada * precioUnitario)
);
GO

-- REPORTE: CALCULAR CONSUMO PARA LIQUIDACIoN (CONSIGNACIoN)
GO
CREATE OR ALTER PROCEDURE Inv_sp_rep_consignacion_calcular
    @proveedorId INT,
    @fechaInicio DATETIME,
    @fechaFin DATETIME
AS
BEGIN
    SET NOCOUNT ON;
    -- Busca todos los consumos en OT de materiales que pertenecen al proveedor
    SELECT 
        p.idProducto,
        p.nombre AS producto,
        p.codigo,
        p.unidad,
        p.costo AS precioUnitario,
        SUM(d.cantidad) AS cantidadConsumida,
        SUM(d.cantidad * p.costo) AS subtotal
    FROM Inv_inv_movimiento_detalle d
    JOIN Inv_inv_movimientos m ON d.idMovimiento = m.idMovimiento
    JOIN Inv_cat_productos p ON d.productoId = p.idProducto
    WHERE m.tipoMovimiento = 'CONSUMO_OT'
      AND m.propietarioTipo = 'PROVEEDOR'
      AND m.proveedorId = @proveedorId
      AND m.fechaMovimiento BETWEEN @fechaInicio AND @fechaFin
    GROUP BY p.idProducto, p.nombre, p.codigo, p.unidad, p.costo;
END
GO

-- PROCEDIMIENTO: REGISTRAR LIQUIDACIoN DE CONSIGNACIoN
GO
CREATE OR ALTER PROCEDURE Inv_sp_inv_liquidacion_procesar
    @proveedorId INT,
    @idUsuario INT,
    @fechaInicio DATETIME,
    @fechaFin DATETIME,
    @notas NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @idLiq INT;
    DECLARE @total DECIMAL(18,2) = 0;

    BEGIN TRANSACTION
    BEGIN TRY
        -- 1. Crear Cabecera
        INSERT INTO Inv_inv_liquidacion_consignacion (proveedorId, idUsuarioResponsable, notas)
        VALUES (@proveedorId, @idUsuario, @notas);
        SET @idLiq = SCOPE_IDENTITY();

        -- 2. Insertar Detalle basado en consumos del periodo
        INSERT INTO Inv_inv_liquidacion_consignacion_det (idLiquidacion, productoId, cantidadLiquidada, precioUnitario)
        SELECT 
            @idLiq,
            p.idProducto,
            SUM(d.cantidad),
            p.costo
        FROM Inv_inv_movimiento_detalle d
        JOIN Inv_inv_movimientos m ON d.idMovimiento = m.idMovimiento
        JOIN Inv_cat_productos p ON d.productoId = p.idProducto
        WHERE m.tipoMovimiento = 'CONSUMO_OT'
          AND m.propietarioTipo = 'PROVEEDOR'
          AND m.proveedorId = @proveedorId
          AND m.fechaMovimiento BETWEEN @fechaInicio AND @fechaFin
        GROUP BY p.idProducto, p.costo;

        -- 3. Actualizar Total
        SELECT @total = SUM(subtotal) FROM Inv_inv_liquidacion_consignacion_det WHERE idLiquidacion = @idLiq;
        UPDATE Inv_inv_liquidacion_consignacion SET totalPagar = ISNULL(@total, 0), estado = 'PAGADA' WHERE idLiquidacion = @idLiq;

        COMMIT TRANSACTION
        SELECT @idLiq AS idLiquidacion;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- REPORTE: SLA Y TIEMPOS DE RESPUESTA (oRDENES DE TRABAJO)
GO
CREATE OR ALTER PROCEDURE Inv_sp_rep_ot_sla_tiempos
    @fechaInicio DATETIME = NULL,
    @fechaFin DATETIME = NULL
AS
BEGIN
    SELECT 
        ot.idOT,
        u.nombre AS tecnico,
        tot.nombre AS tipoOT,
        ot.fechaAsignacion,
        ot.fechaCierre,
        DATEDIFF(HOUR, ot.fechaAsignacion, ot.fechaCierre) AS horasTranscurridas,
        tot.slaHoras AS slaMeta,
        CASE 
            WHEN DATEDIFF(HOUR, ot.fechaAsignacion, ot.fechaCierre) <= tot.slaHoras THEN 'DENTRO'
            ELSE 'FUERA'
        END AS estadoSLA
    FROM Inv_ope_ot ot
    JOIN Inv_seg_usuarios u ON ot.idTecnico = u.idUsuario
    JOIN Inv_cat_tipos_ot tot ON ot.idTipoOT = tot.idTipoOT
    WHERE ot.estado = 'FINALIZADA'
      AND (@fechaInicio IS NULL OR ot.fechaCierre >= @fechaInicio)
      AND (@fechaFin IS NULL OR ot.fechaCierre <= @fechaFin)
    ORDER BY ot.fechaCierre DESC;
END
GO

-- REPORTE: ALERTA DE STOCK BAJO
GO
CREATE OR ALTER PROCEDURE Inv_sp_rep_stock_bajo
    @almacenId INT = NULL
AS
BEGIN
    SELECT 
        alm.nombre AS almacen,
        p.nombre AS producto,
        p.codigo,
        s.cantidad AS stockActual,
        p.minimoStock AS stockMinimo,
        (p.minimoStock - s.cantidad) AS faltante
    FROM Inv_inv_stock s
    JOIN Inv_cat_productos p ON s.productoId = p.idProducto
    JOIN Inv_cat_almacenes alm ON s.almacenId = alm.idAlmacen
    WHERE s.cantidad < p.minimoStock
      AND (@almacenId IS NULL OR s.almacenId = @almacenId)
    ORDER BY (p.minimoStock - s.cantidad) DESC;
END
GO

-- 10. OBSERVABILIDAD (LOGS TeCNICOS)
IF OBJECT_ID('Inv_p_SlowQueries', 'U') IS NULL
CREATE TABLE Inv_p_SlowQueries (
    idLog INT IDENTITY(1,1) PRIMARY KEY,
    duracionMS INT NOT NULL,
    sqlText NVARCHAR(MAX) NOT NULL,
    tipo NVARCHAR(20), -- SP, QUERY
    parametros NVARCHAR(MAX),
    fecha DATETIME DEFAULT GETDATE(),
    origen NVARCHAR(200)
);
GO

-- PROCEDIMIENTO: CREAR oRDEN DE TRABAJO
GO
CREATE OR ALTER PROCEDURE Inv_sp_ot_crear
    @idProyecto INT,
    @idCliente INT,
    @idTipoOT INT,
    @prioridad NVARCHAR(20),
    @direccion NVARCHAR(200),
    @idUsuarioCrea INT,
    @notas NVARCHAR(MAX) = NULL
AS
BEGIN
    INSERT INTO Inv_ope_ot (idProyecto, idCliente, idTipoOT, prioridad, direccion, idUsuarioCrea, estado, notas)
    OUTPUT INSERTED.idOT
    VALUES (@idProyecto, @idCliente, @idTipoOT, @prioridad, @direccion, @idUsuarioCrea, 'REGISTRADA', @notas);
END
GO

-- PROCEDIMIENTO: ASIGNAR TeCNICO A OT
GO
CREATE OR ALTER PROCEDURE Inv_sp_ot_asignar_tecnico
    @idOT INT,
    @idTecnico INT,
    @idUsuarioAsigna INT
AS
BEGIN
    UPDATE Inv_ope_ot 
    SET idTecnico = @idTecnico, 
        estado = 'ASIGNADA', 
        fechaAsignacion = GETDATE()
    WHERE idOT = @idOT;

    INSERT INTO Inv_ope_ot_eventos (idOT, idUsuario, evento, descripcion)
    VALUES (@idOT, @idUsuarioAsigna, 'ASIGNACION', 'OT asignada al tecnico ID: ' + CAST(@idTecnico AS NVARCHAR(10)));
END
GO

-- PROCEDIMIENTO: CERRAR oRDEN DE TRABAJO
GO
CREATE OR ALTER PROCEDURE Inv_sp_ot_cerrar
    @idOT INT,
    @idUsuarioCierra INT,
    @notas NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @tipoOT INT, @reqFirma BIT, @reqEvidencia BIT;
    SELECT @tipoOT = idTipoOT FROM Inv_ope_ot WHERE idOT = @idOT;
    SELECT @reqFirma = requiereFirma, @reqEvidencia = requiereEvidencia FROM Inv_cat_tipos_ot WHERE idTipoOT = @tipoOT;

    -- VALIDACIONES
    IF @reqFirma = 1 AND NOT EXISTS (SELECT 1 FROM Inv_ope_ot_firmas WHERE idOT = @idOT)
        THROW 50000, 'Error: Esta OT requiere firma del cliente para ser cerrada.', 1;

    IF @reqEvidencia = 1 AND NOT EXISTS (SELECT 1 FROM Inv_ope_ot_evidencias WHERE idOT = @idOT)
        THROW 50000, 'Error: Esta OT requiere evidencias fotograficas para ser cerrada.', 1;

    BEGIN TRANSACTION
    BEGIN TRY
        UPDATE Inv_ope_ot 
        SET estado = 'FINALIZADA', 
            fechaCierre = GETDATE(),
            notas = ISNULL(notas, '') + CHAR(13) + ISNULL(@notas, '')
        WHERE idOT = @idOT;

        INSERT INTO Inv_ope_ot_eventos (idOT, idUsuario, evento, descripcion)
        VALUES (@idOT, @idUsuarioCierra, 'CIERRE', 'OT cerrada satisfactoriamente.');

        COMMIT TRANSACTION
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- REPORTE: KARDEX POR PRODUCTO Y ALMACeN
GO
CREATE OR ALTER PROCEDURE Inv_sp_inv_kardex_obtener
    @productoId INT,
    @almacenId INT = NULL,
    @fechaInicio DATETIME = NULL,
    @fechaFin DATETIME = NULL
AS
BEGIN
    SELECT 
        m.fechaMovimiento,
        m.tipoMovimiento,
        almO.nombre AS origen,
        almD.nombre AS destino,
        d.cantidad,
        m.referenciaTexto,
        u.nombre AS responsable
    FROM Inv_inv_movimiento_detalle d
    JOIN Inv_inv_movimientos m ON d.idMovimiento = m.idMovimiento
    LEFT JOIN Inv_cat_almacenes almO ON m.almacenOrigenId = almO.idAlmacen
    LEFT JOIN Inv_cat_almacenes almD ON m.almacenDestinoId = almD.idAlmacen
    JOIN Inv_seg_usuarios u ON m.idUsuarioResponsable = u.idUsuario
    WHERE d.productoId = @productoId
      AND (@almacenId IS NULL OR m.almacenOrigenId = @almacenId OR m.almacenDestinoId = @almacenId)
      AND (@fechaInicio IS NULL OR m.fechaMovimiento >= @fechaInicio)
      AND (@fechaFin IS NULL OR m.fechaMovimiento <= @fechaFin)
    ORDER BY m.fechaMovimiento DESC;
END
GO

-- PROCEDIMIENTO: DEVOLUCIoN DE ACTIVO A BODEGA
GO
CREATE OR ALTER PROCEDURE Inv_sp_activo_devolver
    @idActivo INT,
    @idAlmacenDestino INT,
    @idUsuario INT,
    @notas NVARCHAR(MAX) = NULL
AS
BEGIN
    BEGIN TRANSACTION
    BEGIN TRY
        UPDATE Inv_act_activos 
        SET estado = 'DISPONIBLE', 
            idAlmacenActual = @idAlmacenDestino, 
            idTecnicoActual = NULL 
        WHERE idActivo = @idActivo;

        INSERT INTO Inv_act_movimientos (idActivo, tipoMovimiento, idAlmacenOrigen, idAlmacenDestino, idUsuarioResponsable, notas)
        VALUES (@idActivo, 'DEVOLUCION', NULL, @idAlmacenDestino, @idUsuario, @notas);

        COMMIT TRANSACTION
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- PROCEDIMIENTO: RECIBIR ACTIVO DE REPARACIoN
GO
CREATE OR ALTER PROCEDURE Inv_sp_activo_recibir_reparacion
    @idActivo INT,
    @idReparacion INT,
    @resultado NVARCHAR(20), -- REPARADO, IRREPARABLE
    @costo DECIMAL(18,2),
    @idUsuario INT
AS
BEGIN
    BEGIN TRANSACTION
    BEGIN TRY
        UPDATE Inv_act_reparaciones 
        SET fechaRetorno = GETDATE(), 
            resultado = @resultado, 
            costo = @costo 
        WHERE idReparacion = @idReparacion;

        UPDATE Inv_act_activos 
        SET estado = CASE WHEN @resultado = 'REPARADO' THEN 'DISPONIBLE' ELSE 'DANIADO' END
        WHERE idActivo = @idActivo;

        INSERT INTO Inv_act_movimientos (idActivo, tipoMovimiento, idUsuarioResponsable, notas)
        VALUES (@idActivo, 'RETORNO_REPARACION', @idUsuario, 'Resultado: ' + @resultado);

        COMMIT TRANSACTION
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- PROCEDIMIENTO: REEMPLAZO DE ACTIVO EN OT (TRANSACCIONAL)
GO
CREATE OR ALTER PROCEDURE Inv_sp_ot_activo_reemplazar
    @idOT INT,
    @idActivoSaliente INT, -- El que se retira del cliente
    @idActivoEntrante INT,  -- El que se instala
    @idUsuario INT,
    @motivo NVARCHAR(MAX) = NULL
AS
BEGIN
    BEGIN TRANSACTION
    BEGIN TRY
        -- 1. Retirar equipo viejo
        UPDATE Inv_act_activos SET estado = 'DANIADO', idClienteActual = NULL, idAlmacenActual = NULL WHERE idActivo = @idActivoSaliente;
        
        -- 2. Instalar equipo nuevo
        UPDATE Inv_act_activos SET estado = 'INSTALADO_EN_CLIENTE', idClienteActual = (SELECT idCliente FROM Inv_ope_ot WHERE idOT = @idOT) WHERE idActivo = @idActivoEntrante;

        -- 3. Registrar en detalle de OT
        INSERT INTO Inv_ope_ot_activos (idOT, idActivo, tipoAccion, notas)
        VALUES (@idOT, @idActivoSaliente, 'RETIRADO', 'Reemplazado por ' + CAST(@idActivoEntrante AS NVARCHAR(10)));
        
        INSERT INTO Inv_ope_ot_activos (idOT, idActivo, tipoAccion, notas)
        VALUES (@idOT, @idActivoEntrante, 'INSTALADO', 'Reemplaza a ' + CAST(@idActivoSaliente AS NVARCHAR(10)));

        COMMIT TRANSACTION
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- PROCEDIMIENTO: OBTENER STOCK (PAGINADO Y FILTRADO)
GO
CREATE OR ALTER PROCEDURE Inv_sp_inv_stock_obtener
    @almacenId INT = NULL,
    @productoId INT = NULL,
    @buscar NVARCHAR(100) = NULL
AS
BEGIN
    SELECT 
        s.almacenId,
        alm.nombre AS almacenNombre,
        s.productoId,
        p.nombre AS productoNombre,
        p.codigo AS productoCodigo,
        s.propietarioTipo,
        s.proveedorId,
        prov.nombre AS proveedorNombre,
        s.cantidad,
        p.unidad
    FROM Inv_inv_stock s
    JOIN Inv_cat_productos p ON s.productoId = p.idProducto
    JOIN Inv_cat_almacenes alm ON s.almacenId = alm.idAlmacen
    LEFT JOIN Inv_cat_proveedores prov ON s.proveedorId = prov.idProveedor
    WHERE (@almacenId IS NULL OR s.almacenId = @almacenId)
      AND (@productoId IS NULL OR s.productoId = @productoId)
      AND (@buscar IS NULL OR p.nombre LIKE '%' + @buscar + '%' OR p.codigo LIKE '%' + @buscar + '%')
    ORDER BY p.nombre;
END
GO

-- PROCEDIMIENTO: LISTAR ACTIVOS (FILTRADO)
GO
CREATE OR ALTER PROCEDURE Inv_sp_activos_listar
    @estado NVARCHAR(50) = NULL,
    @idAlmacen INT = NULL,
    @idTecnico INT = NULL,
    @buscar NVARCHAR(100) = NULL
AS
BEGIN
    SELECT 
        a.*,
        p.nombre AS productoNombre,
        p.codigo AS productoCodigo
    FROM Inv_act_activos a
    JOIN Inv_cat_productos p ON a.idProducto = p.idProducto
    WHERE (@estado IS NULL OR a.estado = @estado)
      AND (@idAlmacen IS NULL OR a.idAlmacenActual = @idAlmacen)
      AND (@idTecnico IS NULL OR a.idTecnicoActual = @idTecnico)
      AND (@buscar IS NULL OR a.serial LIKE '%' + @buscar + '%' OR p.nombre LIKE '%' + @buscar + '%');
END
GO

-- REPORTE: CONSUMO POR TeCNICO
GO
CREATE OR ALTER PROCEDURE Inv_sp_rep_consumo_por_tecnico
    @fechaInicio DATETIME = NULL,
    @fechaFin DATETIME = NULL
AS
BEGIN
    SELECT 
        u.nombre AS tecnico,
        p.nombre AS producto,
        p.codigo,
        SUM(d.cantidad) AS totalConsumido,
        p.unidad,
        SUM(d.cantidad * p.costo) AS costoTotal
    FROM Inv_inv_movimiento_detalle d
    JOIN Inv_inv_movimientos m ON d.idMovimiento = m.idMovimiento
    JOIN Inv_cat_productos p ON d.productoId = p.idProducto
    JOIN Inv_seg_usuarios u ON m.idUsuarioResponsable = u.idUsuario
    WHERE m.tipoMovimiento = 'CONSUMO_OT'
      AND (@fechaInicio IS NULL OR m.fechaMovimiento >= @fechaInicio)
      AND (@fechaFin IS NULL OR m.fechaMovimiento <= @fechaFin)
    GROUP BY u.nombre, p.nombre, p.codigo, p.unidad
    ORDER BY u.nombre, totalConsumido DESC;
END
GO

-- REPORTE: ESTADO DE ACTIVOS (RESUMEN)
GO
CREATE OR ALTER PROCEDURE Inv_sp_rep_activos_estado
AS
BEGIN
    SELECT 
        estado,
        COUNT(*) AS total,
        SUM(p.costo) AS valorEstimado
    FROM Inv_act_activos a
    JOIN Inv_cat_productos p ON a.idProducto = p.idProducto
    GROUP BY estado;
END
GO

-- ================================================================================
-- 11. PROCEDIMIENTOS DE CONTROL AVANZADOS Y SEGURIDAD
-- ================================================================================

-- PROCEDIMIENTO: VERIFICAR PERMISOS DE USUARIO
GO
CREATE OR ALTER PROCEDURE Inv_sp_seg_permisos_verificar
    @idUsuario INT,
    @modulo NVARCHAR(50),
    @accion NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    -- Esta version simplificada asume que las reglas residen en el JSON del Rol
    -- En versiones futuras se puede expandir a una matriz de permisos granular
    SELECT 
        CAST(CASE WHEN r.reglas LIKE '%' + @modulo + ':' + @accion + '%' OR r.nombre = 'Administrador' THEN 1 ELSE 0 END AS BIT) AS tienePermiso
    FROM Inv_seg_usuarios u
    JOIN Inv_seg_roles r ON u.idRol = r.idRol
    WHERE u.idUsuario = @idUsuario;
END
GO

-- PROCEDIMIENTO: CREAR PROYECTO
GO
CREATE OR ALTER PROCEDURE Inv_sp_proyecto_crear
    @nombre NVARCHAR(150),
    @descripcion NVARCHAR(MAX),
    @idResponsable INT,
    @fechaInicio DATETIME = NULL,
    @fechaFin DATETIME = NULL
AS
BEGIN
    INSERT INTO Inv_ope_proyectos (nombre, descripcion, idResponsable, fechaInicio, fechaFin, estado)
    VALUES (@nombre, @descripcion, @idResponsable, @fechaInicio, @fechaFin, 'PLANIFICADO');
    
    SELECT SCOPE_IDENTITY() AS idProyecto;
END
GO

-- PROCEDIMIENTO: RESUMEN DE AVANCE Y COSTOS DE PROYECTO
GO
CREATE OR ALTER PROCEDURE Inv_sp_proyecto_resumen
    @idProyecto INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @totalOT INT, @cerradasOT INT, @avance DECIMAL(5,2);
    
    SELECT @totalOT = COUNT(*) FROM Inv_ope_ot WHERE idProyecto = @idProyecto;
    SELECT @cerradasOT = COUNT(*) FROM Inv_ope_ot WHERE idProyecto = @idProyecto AND estado = 'FINALIZADA';
    
    SET @avance = CASE WHEN @totalOT = 0 THEN 0 ELSE (CAST(@cerradasOT AS DECIMAL) / @totalOT) * 100 END;

    SELECT 
        p.idProyecto,
        p.nombre,
        p.estado,
        @avance AS porcentajeAvance,
        ISNULL(SUM(c.cantidad * prod.costo), 0) AS costoMaterialesTotal,
        @totalOT AS totalOT,
        @cerradasOT AS cerradasOT
    FROM Inv_ope_proyectos p
    LEFT JOIN Inv_ope_ot ot ON p.idProyecto = ot.idProyecto
    LEFT JOIN Inv_ope_ot_consumo c ON ot.idOT = c.idOT
    LEFT JOIN Inv_cat_productos prod ON c.productoId = prod.idProducto
    WHERE p.idProyecto = @idProyecto
    GROUP BY p.idProyecto, p.nombre, p.estado;
END
GO

-- PROCEDIMIENTO: DAR DE BAJA ACTIVO (CON APROBACIoN)
GO
CREATE OR ALTER PROCEDURE Inv_sp_activo_dar_baja
    @idActivo INT,
    @idUsuario INT,
    @motivo NVARCHAR(MAX)
AS
BEGIN
    BEGIN TRANSACTION
    BEGIN TRY
        UPDATE Inv_act_activos 
        SET estado = 'BAJA', 
            idAlmacenActual = NULL, 
            idTecnicoActual = NULL 
        WHERE idActivo = @idActivo;

        INSERT INTO Inv_act_movimientos (idActivo, tipoMovimiento, idUsuarioResponsable, notas)
        VALUES (@idActivo, 'BAJA_DEFINITIVA', @idUsuario, @motivo);

        COMMIT TRANSACTION
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- PROCEDIMIENTO: VALIDAR STOCK DISPONIBLE (PRE-MOVIMIENTO)
GO
CREATE OR ALTER PROCEDURE Inv_sp_inv_validar_stock
    @almacenId INT,
    @productoId INT,
    @cantidadRequerida DECIMAL(18,2)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @actual DECIMAL(18,2);
    SELECT @actual = ISNULL(cantidad, 0) FROM Inv_inv_stock 
    WHERE almacenId = @almacenId AND productoId = @productoId AND propietarioTipo = 'EMPRESA';

    IF @actual < @cantidadRequerida
    BEGIN
        DECLARE @msg NVARCHAR(200) = 'Stock insuficiente en almacen. Disponible: ' + CAST(@actual AS NVARCHAR(20)) + ', Requerido: ' + CAST(@cantidadRequerida AS NVARCHAR(20));
        THROW 50001, @msg, 1;
    END

    SELECT 1 AS esValido;
END
GO

-- ================================================================================
-- 12. AUTENTICACIoN Y SESIONES
-- ================================================================================

-- PROCEDIMIENTO: LOGIN DE USUARIO
GO
CREATE OR ALTER PROCEDURE Inv_sp_auth_login
    @correo NVARCHAR(100),
    @password NVARCHAR(MAX) -- Debe venir hasheada desde el backend
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @idUsuario INT, @idRol INT;

    SELECT @idUsuario = idUsuario, @idRol = idRol 
    FROM Inv_seg_usuarios 
    WHERE correo = @correo AND password = @password AND activo = 1;

    IF @idUsuario IS NOT NULL
    BEGIN
        UPDATE Inv_seg_usuarios SET ultimoAcceso = GETDATE() WHERE idUsuario = @idUsuario;
        
        SELECT 
            u.idUsuario, u.nombre, u.correo, u.idRol, r.nombre AS rolNombre,
            u.idAlmacenTecnico
        FROM Inv_seg_usuarios u
        JOIN Inv_seg_roles r ON u.idRol = r.idRol
        WHERE u.idUsuario = @idUsuario;
    END
    ELSE
    BEGIN
        THROW 50002, 'Credenciales invalidas o usuario inactivo.', 1;
    END
END
GO

-- PROCEDIMIENTO: REGISTRAR REFRESH TOKEN
GO
CREATE OR ALTER PROCEDURE Inv_sp_auth_token_registrar
    @idUsuario INT,
    @token NVARCHAR(500),
    @expira DATETIME
AS
BEGIN
    -- Revocar tokens anteriores para el mismo usuario (opcional, por seguridad)
    UPDATE Inv_seg_refresh_tokens SET revocado = GETDATE() WHERE idUsuario = @idUsuario AND revocado IS NULL;

    INSERT INTO Inv_seg_refresh_tokens (idUsuario, token, expira)
    VALUES (@idUsuario, @token, @expira);
END
GO

-- PROCEDIMIENTO: VALIDAR REFRESH TOKEN
GO
CREATE OR ALTER PROCEDURE Inv_sp_auth_token_validar
    @token NVARCHAR(500)
AS
BEGIN
    SELECT idUsuario 
    FROM Inv_seg_refresh_tokens 
    WHERE token = @token AND revocado IS NULL AND expira > GETDATE();
END
GO

-- PROCEDIMIENTO: HISTORIAL DE UN ACTIVO
GO
CREATE OR ALTER PROCEDURE Inv_sp_activo_historial
    @idActivo INT
AS
BEGIN
    SELECT 
        m.fechaMovimiento,
        m.tipoMovimiento,
        u.nombre AS responsable,
        ao.nombre AS almacenAnterior,
        an.nombre AS almacenNuevo,
        m.notas
    FROM Inv_act_movimientos m
    JOIN Inv_seg_usuarios u ON m.idUsuarioResponsable = u.idUsuario
    LEFT JOIN Inv_cat_almacenes ao ON m.almacenAnteriorId = ao.idAlmacen
    LEFT JOIN Inv_cat_almacenes an ON m.almacenNuevoId = an.idAlmacen
    WHERE m.idActivo = @idActivo
    ORDER BY m.fechaMovimiento DESC;
END
GO

-- ================================================================================
-- 13. DATA INICIAL (SEED DATA)
-- ================================================================================

-- ROLES
IF NOT EXISTS (SELECT 1 FROM Inv_seg_roles)
BEGIN
    INSERT INTO Inv_seg_roles (nombre, descripcion, reglas)
    VALUES 
    ('Administrador', 'Acceso total al sistema', '["*"]'),
    ('Despacho', 'Gestion de inventario y asignacion de OT', '["inventario:*", "operaciones:*"]'),
    ('Tecnico', 'Uso movil: consumo y evidencias', '["operaciones:ver", "operaciones:consumir", "inventario:ver_propio"]');
END

-- USUARIO ADMIN (Password: admin123 - Hasheada demostrativa)
IF NOT EXISTS (SELECT 1 FROM Inv_seg_usuarios WHERE carnet = 'ADMIN01')
BEGIN
    INSERT INTO Inv_seg_usuarios (nombre, correo, carnet, password, idRol)
    VALUES ('Administrador Sistema', 'admin@empresa.com', 'ADMIN01', 'admin123', 1);
END

-- CATEGORiAS BASE
IF NOT EXISTS (SELECT 1 FROM Inv_cat_categorias_producto)
BEGIN
    INSERT INTO Inv_cat_categorias_producto (nombre, descripcion)
    VALUES 
    ('Consumibles', 'Cables, conectores, tornilleria'),
    ('Equipos Cliente', 'ONTs, Routers, Decodificadores'),
    ('Herramientas', 'Taladros, fusionadoras, escaleras');
END

-- ALMACeN CENTRAL
IF NOT EXISTS (SELECT 1 FROM Inv_cat_almacenes)
BEGIN
    INSERT INTO Inv_cat_almacenes (nombre, tipo, ubicacion)
    VALUES ('Bodega Central Norte', 'CENTRAL', 'Zona Industrial 1');
END
GO

-- ================================================================================
-- 14. CRUD DE CATaLOGOS BASE
-- ================================================================================

-- CATEGORiAS
GO
CREATE OR ALTER PROCEDURE Inv_sp_cat_categoria_upsert
    @id INT = 0,
    @nombre NVARCHAR(100),
    @descripcion NVARCHAR(250) = NULL
AS
BEGIN
    IF @id = 0
        INSERT INTO Inv_cat_categorias_producto (nombre, descripcion) VALUES (@nombre, @descripcion);
    ELSE
        UPDATE Inv_cat_categorias_producto SET nombre = @nombre, descripcion = @descripcion WHERE idCategoria = @id;
END
GO

-- PROVEEDORES
GO
CREATE OR ALTER PROCEDURE Inv_sp_cat_proveedor_upsert
    @id INT = 0,
    @nombre NVARCHAR(150),
    @nit NVARCHAR(50) = NULL,
    @contacto NVARCHAR(100) = NULL,
    @telefono NVARCHAR(50) = NULL,
    @correo NVARCHAR(100) = NULL
AS
BEGIN
    IF @id = 0
        INSERT INTO Inv_cat_proveedores (nombre, nit, contacto, telefono, correo) VALUES (@nombre, @nit, @contacto, @telefono, @correo);
    ELSE
        UPDATE Inv_cat_proveedores SET nombre = @nombre, nit = @nit, contacto = @contacto, telefono = @telefono, correo = @correo WHERE idProveedor = @id;
END
GO

-- PRODUCTOS
GO
CREATE OR ALTER PROCEDURE Inv_sp_cat_producto_upsert
    @id INT = 0,
    @codigo NVARCHAR(50),
    @nombre NVARCHAR(200),
    @idCategoria INT,
    @unidad NVARCHAR(20),
    @esSerializado BIT,
    @costo DECIMAL(18,2),
    @minimoStock INT
AS
BEGIN
    IF @id = 0
        INSERT INTO Inv_cat_productos (codigo, nombre, idCategoria, unidad, esSerializado, costo, minimoStock)
        VALUES (@codigo, @nombre, @idCategoria, @unidad, @esSerializado, @costo, @minimoStock);
    ELSE
        UPDATE Inv_cat_productos SET 
            codigo = @codigo, nombre = @nombre, idCategoria = @idCategoria, 
            unidad = @unidad, esSerializado = @esSerializado, costo = @costo, minimoStock = @minimoStock
        WHERE idProducto = @id;
END
GO

-- ALMACENES
GO
CREATE OR ALTER PROCEDURE Inv_sp_cat_almacen_upsert
    @id INT = 0,
    @nombre NVARCHAR(100),
    @idPadre INT = NULL,
    @tipo NVARCHAR(20),
    @responsableId INT = NULL,
    @ubicacion NVARCHAR(200) = NULL
AS
BEGIN
    IF @id = 0
        INSERT INTO Inv_cat_almacenes (nombre, idPadre, tipo, responsableId, ubicacion)
        VALUES (@nombre, @idPadre, @tipo, @responsableId, @ubicacion);
    ELSE
        UPDATE Inv_cat_almacenes SET 
            nombre = @nombre, idPadre = @idPadre, tipo = @tipo, 
            responsableId = @responsableId, ubicacion = @ubicacion
        WHERE idAlmacen = @id;
END
GO

-- LISTAR CATaLOGOS (GENeRICO)
GO
CREATE OR ALTER PROCEDURE Inv_sp_cat_listar
    @entidad NVARCHAR(50) -- CATEGORIAS, PROVEEDORES, PRODUCTOS, ALMACENES
AS
BEGIN
    IF @entidad = 'CATEGORIAS' SELECT * FROM Inv_cat_categorias_producto WHERE activo = 1 ORDER BY nombre;
    IF @entidad = 'PROVEEDORES' SELECT * FROM Inv_cat_proveedores WHERE activo = 1 ORDER BY nombre;
    IF @entidad = 'PRODUCTOS' SELECT p.*, c.nombre AS categoriaNombre FROM Inv_cat_productos p JOIN Inv_cat_categorias_producto c ON p.idCategoria = c.idCategoria WHERE p.activo = 1 ORDER BY p.nombre;
    IF @entidad = 'ALMACENES' SELECT a.*, p.nombre AS padreNombre FROM Inv_cat_almacenes a LEFT JOIN Inv_cat_almacenes p ON a.idPadre = p.idAlmacen WHERE a.activo = 1 ORDER BY a.nombre;
END
GO

-- ================================================================================
-- 15. AUDITORiA: CONTEO FiSICO
-- ================================================================================

-- INICIAR CONTEO
GO
CREATE OR ALTER PROCEDURE Inv_sp_conteo_iniciar
    @almacenId INT,
    @idUsuario INT,
    @notas NVARCHAR(MAX) = NULL
AS
BEGIN
    INSERT INTO Inv_inv_conteos_cabecera (almacenId, idUsuarioResponsable, notas, estado)
    VALUES (@almacenId, @idUsuario, @notas, 'INICIADO');
    
    SELECT SCOPE_IDENTITY() AS idConteo;
END
GO

-- REGISTRAR ITEM EN CONTEO
GO
CREATE OR ALTER PROCEDURE Inv_sp_conteo_registrar_item
    @idConteo INT,
    @productoId INT,
    @stockFisico DECIMAL(18,2)
AS
BEGIN
    DECLARE @stockSistema DECIMAL(18,2) = 0, @almacenId INT;
    
    SELECT @almacenId = almacenId FROM Inv_inv_conteos_cabecera WHERE idConteo = @idConteo;
    
    SELECT @stockSistema = ISNULL(SUM(cantidad), 0) 
    FROM Inv_inv_stock 
    WHERE almacenId = @almacenId AND productoId = @productoId AND propietarioTipo = 'EMPRESA';

    IF EXISTS (SELECT 1 FROM Inv_inv_conteos_detalle WHERE idConteo = @idConteo AND productoId = @productoId)
        UPDATE Inv_inv_conteos_detalle SET stockFisico = @stockFisico, diferencia = @stockFisico - stockSistema WHERE idConteo = @idConteo AND productoId = @productoId;
    ELSE
        INSERT INTO Inv_inv_conteos_detalle (idConteo, productoId, stockSistema, stockFisico, diferencia)
        VALUES (@idConteo, @productoId, @stockSistema, @stockFisico, @stockFisico - @stockSistema);
END
GO

-- FINALIZAR CONTEO Y APLICAR AJUSTES
GO
CREATE OR ALTER PROCEDURE Inv_sp_conteo_finalizar
    @idConteo INT,
    @idUsuario INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION
    BEGIN TRY
        UPDATE Inv_inv_conteos_cabecera 
        SET estado = 'FINALIZADO', fechaFin = GETDATE() 
        WHERE idConteo = @idConteo;

        -- Generar Ajustes de Stock basados en las diferencias
        DECLARE @pId INT, @dif DECIMAL(18,2), @almId INT;
        SELECT @almId = almacenId FROM Inv_inv_conteos_cabecera WHERE idConteo = @idConteo;

        DECLARE cur CURSOR FOR SELECT productoId, diferencia FROM Inv_inv_conteos_detalle WHERE idConteo = @idConteo AND diferencia <> 0;
        OPEN cur;
        FETCH NEXT FROM cur INTO @pId, @dif;
        WHILE @@FETCH_STATUS = 0
        BEGIN
            DECLARE @nuevaCant DECIMAL(18,2);
            SELECT @nuevaCant = ISNULL(SUM(cantidad), 0) + @dif FROM Inv_inv_stock WHERE almacenId = @almId AND productoId = @pId AND propietarioTipo = 'EMPRESA';

            -- Usar el procedimiento oficial de ajuste
            EXEC Inv_sp_inv_stock_ajustar 
                @almacenId = @almId, 
                @productoId = @pId, 
                @nuevaCantidad = @nuevaCant, 
                @motivo = 'Ajuste automatico por Conteo Fisico', 
                @idUsuario = @idUsuario;

            FETCH NEXT FROM cur INTO @pId, @dif;
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

-- REPORTE: CONSUMO DETALLADO POR OT
GO
CREATE OR ALTER PROCEDURE Inv_sp_rep_consumo_por_ot
    @idOT INT
AS
BEGIN
    SELECT 
        ot.idOT,
        p.idProyecto,
        p.nombre AS proyectoNombre,
        prod.codigo,
        prod.nombre AS productoNombre,
        c.cantidad,
        prod.unidad,
        c.fechaConsumo
    FROM Inv_ope_ot_consumo c
    JOIN Inv_ope_ot ot ON c.idOT = ot.idOT
    JOIN Inv_cat_productos prod ON c.productoId = prod.idProducto
    LEFT JOIN Inv_ope_proyectos p ON ot.idProyecto = p.idProyecto
    WHERE ot.idOT = @idOT;
END
GO
