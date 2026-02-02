-- =============================================
-- Módulo de Gestión de Vehículos (Flotas)
-- =============================================
USE inventario;
GO

-- 1. Catálogo de Vehículos
CREATE TABLE Inv_cat_vehiculos (
    idVehiculo INT PRIMARY KEY IDENTITY(1,1),
    placa NVARCHAR(20) NOT NULL UNIQUE,
    marca NVARCHAR(50),
    modelo NVARCHAR(50),
    anio INT,
    idTecnicoAsignado INT NULL, -- FK a Inv_seg_usuarios
    activo BIT DEFAULT 1,
    fechaCreacion DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Vehiculo_Tecnico FOREIGN KEY (idTecnicoAsignado) REFERENCES Inv_seg_usuarios(idUsuario)
);
GO

-- 2. Registro diario de Operación (Combustible y Kilometraje)
CREATE TABLE Inv_ope_vehiculos_log (
    idLog INT PRIMARY KEY IDENTITY(1,1),
    idVehiculo INT NOT NULL,
    idUsuario INT NOT NULL, -- Técnico que reporta
    fechaLog DATE DEFAULT GETDATE(),
    kmEntrada INT,
    kmSalida INT,
    gastoCombustible DECIMAL(18,2) DEFAULT 0,
    numeroVoucher NVARCHAR(50),
    urlVoucher NVARCHAR(MAX), -- Foto del recibo
    notas NVARCHAR(MAX),
    CONSTRAINT FK_Log_Vehiculo FOREIGN KEY (idVehiculo) REFERENCES Inv_cat_vehiculos(idVehiculo),
    CONSTRAINT FK_Log_Usuario FOREIGN KEY (idUsuario) REFERENCES Inv_seg_usuarios(idUsuario)
);
GO

-- 3. Procedimientos Almacenados Básicos
CREATE OR ALTER PROCEDURE Inv_sp_vehiculos_listar
AS
BEGIN
    SELECT v.*, u.nombre as tecnicoNombre 
    FROM Inv_cat_vehiculos v
    LEFT JOIN Inv_seg_usuarios u ON v.idTecnicoAsignado = u.idUsuario
    WHERE v.activo = 1;
END
GO

CREATE OR ALTER PROCEDURE Inv_sp_vehiculos_registrar_log
    @idVehiculo INT,
    @idUsuario INT,
    @kmEntrada INT,
    @kmSalida INT,
    @gasto DECIMAL(18,2),
    @voucher NVARCHAR(50),
    @urlVoucher NVARCHAR(MAX) = NULL
AS
BEGIN
    INSERT INTO Inv_ope_vehiculos_log (idVehiculo, idUsuario, kmEntrada, kmSalida, gastoCombustible, numeroVoucher, urlVoucher)
    VALUES (@idVehiculo, @idUsuario, @kmEntrada, @kmSalida, @gasto, @voucher, @urlVoucher);
END
GO
