
-- ========================================================
-- MIGRACIÓN ESTRUCTURAL: SISTEMA BASADO EN CARNET (MÁXIMO PERFORMANCE)
-- Fecha: 2026-01-25
-- Descripción: Agrega columnas de Carnet a tablas de negocio y migra datos existentes.
-- ========================================================

-- 1. Agregar columnas carnet donde falten
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'p_Notas' AND COLUMN_NAME = 'carnet')
    ALTER TABLE p_Notas ADD carnet NVARCHAR(50);

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Inv_ope_planes_trabajo' AND COLUMN_NAME = 'carnet')
    ALTER TABLE Inv_ope_planes_trabajo ADD carnet NVARCHAR(50);

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Inv_ope_checkin_tareas' AND COLUMN_NAME = 'carnet')
    ALTER TABLE Inv_ope_checkin_tareas ADD carnet NVARCHAR(50);

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Inv_ope_proyecto_bloqueos' AND COLUMN_NAME = 'carnetOrigen')
    ALTER TABLE Inv_ope_proyecto_bloqueos ADD carnetOrigen NVARCHAR(50), carnetDestino NVARCHAR(50);

-- 2. Migrar datos de ID a Carnet (Sync inicial)
UPDATE n SET n.carnet = u.carnet FROM p_Notas n JOIN Inv_seg_usuarios u ON n.idUsuario = u.idUsuario WHERE n.carnet IS NULL;
UPDATE p SET p.carnet = u.carnet FROM Inv_ope_planes_trabajo p JOIN Inv_seg_usuarios u ON p.idUsuario = u.idUsuario WHERE p.carnet IS NULL;
UPDATE c SET c.carnet = u.carnet FROM Inv_ope_checkin_tareas c JOIN Inv_seg_usuarios u ON c.idUsuario = u.idUsuario WHERE c.carnet IS NULL;
UPDATE b SET b.carnetOrigen = u.carnet FROM Inv_ope_proyecto_bloqueos b JOIN Inv_seg_usuarios u ON b.idOrigenUsuario = u.idUsuario WHERE b.carnetOrigen IS NULL;
UPDATE b SET b.carnetDestino = u.carnet FROM Inv_ope_proyecto_bloqueos b JOIN Inv_seg_usuarios u ON b.idDestinoUsuario = u.idUsuario WHERE b.carnetDestino IS NULL;

-- 3. Crear Índices para Máxima Performance
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_p_Notas_Carnet')
    CREATE INDEX IX_p_Notas_Carnet ON p_Notas(carnet);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_p_PlanesTrabajo_Carnet')
    CREATE INDEX IX_p_PlanesTrabajo_Carnet ON Inv_ope_planes_trabajo(carnet);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_p_TareaAsignados_Carnet')
    CREATE INDEX IX_p_TareaAsignados_Carnet ON Inv_ope_proyecto_tarea_asignados(carnet);

GO

-- ========================================================
-- ACTUALIZACIÓN DE STORED PROCEDURES (VERSION CARNET)
-- ========================================================

-- SP de Notas
CREATE OR ALTER PROCEDURE [dbo].[sp_Notas_Obtener]
    @carnet NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM p_Notas WHERE carnet = @carnet ORDER BY fechaModificacion DESC;
END
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_Nota_Crear]
    @carnet NVARCHAR(50),
    @titulo NVARCHAR(200),
    @contenido NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    -- Seguimos guardando idUsuario por retrocompatibilidad si es FK obligatoria, pero el input es Carnet
    DECLARE @idUsuario INT;
    SELECT @idUsuario = idUsuario FROM Inv_seg_usuarios WHERE carnet = @carnet;

    INSERT INTO p_Notas (carnet, idUsuario, titulo, contenido, fechaCreacion, fechaModificacion)
    VALUES (@carnet, @idUsuario, @titulo, @contenido, GETDATE(), GETDATE());
END
GO

-- SP de Checkins
CREATE OR ALTER PROCEDURE [dbo].[sp_Checkin_Upsert]
    @idTarea INT,
    @carnet NVARCHAR(50),
    @estado NVARCHAR(50),
    @comentario NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @idUsuario INT;
    SELECT @idUsuario = idUsuario FROM Inv_seg_usuarios WHERE carnet = @carnet;

    IF EXISTS (SELECT 1 FROM Inv_ope_checkin_tareas WHERE idTarea = @idTarea AND carnet = @carnet)
    BEGIN
        UPDATE Inv_ope_checkin_tareas 
        SET estado = @estado, comentario = @comentario, fechaActualizacion = GETDATE()
        WHERE idTarea = @idTarea AND carnet = @carnet;
    END
    ELSE
    BEGIN
        INSERT INTO Inv_ope_checkin_tareas (idTarea, idUsuario, carnet, estado, comentario, fechaCreacion, fechaActualizacion)
        VALUES (@idTarea, @idUsuario, @carnet, @estado, @comentario, GETDATE(), GETDATE());
    END
END
GO

-- SP de Bloqueos
CREATE OR ALTER PROCEDURE [dbo].[sp_Tarea_Bloquear]
    @idTarea INT,
    @carnetOrigen NVARCHAR(50),
    @carnetDestino NVARCHAR(50) = NULL,
    @motivo NVARCHAR(255),
    @destinoTexto NVARCHAR(255) = NULL,
    @accionMitigacion NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @idOrigen INT, @idDestino INT;
    SELECT @idOrigen = idUsuario FROM Inv_seg_usuarios WHERE carnet = @carnetOrigen;
    IF @carnetDestino IS NOT NULL SELECT @idDestino = idUsuario FROM Inv_seg_usuarios WHERE carnet = @carnetDestino;

    INSERT INTO Inv_ope_proyecto_bloqueos(idTarea, idOrigenUsuario, idDestinoUsuario, carnetOrigen, carnetDestino, destinoTexto, motivo, accionMitigacion, creadoEn, estado)
    VALUES(@idTarea, @idOrigen, @idDestino, @carnetOrigen, @carnetDestino, @destinoTexto, @motivo, @accionMitigacion, GETDATE(), 'Activo');

    UPDATE Inv_ope_proyecto_tareas SET estado = 'Bloqueada' WHERE idTarea = @idTarea;
END
GO


