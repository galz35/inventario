USE Bdplaner;
GO

-- Asegurar Clientes
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Inv_cat_clientes')
BEGIN
    CREATE TABLE Inv_cat_clientes (
        idCliente INT IDENTITY(1,1) PRIMARY KEY,
        nombre NVARCHAR(150) NOT NULL,
        direccion NVARCHAR(255)
    );
END

-- Asegurar Tipos OT
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Inv_cat_tipos_ot')
BEGIN
    CREATE TABLE Inv_cat_tipos_ot (
        idTipoOT INT IDENTITY(1,1) PRIMARY KEY,
        nombre NVARCHAR(100) NOT NULL
    );
END

-- Seed Clientes
IF NOT EXISTS (SELECT 1 FROM Inv_cat_clientes)
BEGIN
    INSERT INTO Inv_cat_clientes (nombre, direccion) VALUES ('General Corporativo', 'Av. Central 123');
END

-- Seed Tipos OT
IF NOT EXISTS (SELECT 1 FROM Inv_cat_tipos_ot)
BEGIN
    INSERT INTO Inv_cat_tipos_ot (nombre) VALUES ('INSTALACION'), ('MANTENIMIENTO');
END

-- 1. Proyecto Demo
IF NOT EXISTS (SELECT 1 FROM Inv_ope_proyectos WHERE nombre = 'Proyecto Demo Fibra')
BEGIN
    INSERT INTO Inv_ope_proyectos (nombre, descripcion, estado, fechaInicio)
    VALUES ('Proyecto Demo Fibra', 'Instalación de red en Edificio Central', 'ACTIVO', GETDATE());
END

DECLARE @pid INT = (SELECT TOP 1 idProyecto FROM Inv_ope_proyectos WHERE nombre = 'Proyecto Demo Fibra');

-- 2. Tareas
IF NOT EXISTS (SELECT 1 FROM Inv_ope_tareas WHERE idProyecto = @pid)
BEGIN
    INSERT INTO Inv_ope_tareas (idProyecto, nombre, descripcion, estado)
    VALUES (@pid, 'Cableado Horizontal', 'Tendido de cable en ductos', 'PENDIENTE'),
           (@pid, 'Fusión de FO', 'Empalmes en cajas terminales', 'PENDIENTE');
END

-- 3. OT vinculada (usando nombres de columna correctos)
IF NOT EXISTS (SELECT 1 FROM Inv_ope_ot WHERE idProyecto = @pid)
BEGIN
    DECLARE @cid INT = (SELECT TOP 1 idCliente FROM Inv_cat_clientes);
    DECLARE @tid INT = (SELECT TOP 1 idTipoOT FROM Inv_cat_tipos_ot);
    
    INSERT INTO Inv_ope_ot (idProyecto, idCliente, idTipoOT, prioridad, direccion, estado, notas, idTarea)
    VALUES (@pid, @cid, @tid, 'ALTA', 'Av. Central 456', 'REGISTRADA', 'Cita programada para mañana', (SELECT TOP 1 idTarea FROM Inv_ope_tareas WHERE idProyecto = @pid));
END

PRINT '✅ Datos de demostración cargados exitosamente.';
GO
