
/* =========================================================
   0) MIGRACIÓN DE ESQUEMA (DDL) - COLUMNAS FALTANTES
   ========================================================= */

-- Actualizar tabla p_Tareas con nuevos campos
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.p_Tareas') AND name = 'requiereEvidencia')
BEGIN
    ALTER TABLE dbo.p_Tareas ADD requiereEvidencia BIT DEFAULT 0 WITH VALUES;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.p_Tareas') AND name = 'idEntregable')
BEGIN
    ALTER TABLE dbo.p_Tareas ADD idEntregable INT NULL;
END
GO

-- Actualizar tabla p_Bloqueos (o crearla si no existe con la estructura correcta)
IF OBJECT_ID('dbo.p_Bloqueos', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.p_Bloqueos (
        idBloqueo INT IDENTITY(1,1) PRIMARY KEY,
        idTarea INT NOT NULL,
        idOrigenUsuario INT NOT NULL,
        idDestinoUsuario INT NULL,
        destinoTexto NVARCHAR(200) NULL,
        motivo NVARCHAR(1000) NULL,
        accionMitigacion NVARCHAR(1000) NULL,
        creadoEn DATETIME DEFAULT GETDATE(),
        estado NVARCHAR(50) DEFAULT 'Activo',
        fechaResolucion DATETIME NULL,
        resolucion NVARCHAR(2000) NULL
    );
END
ELSE
BEGIN
    -- Si existe, asegurar columnas faltantes
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.p_Bloqueos') AND name = 'creadoEn')
        ALTER TABLE dbo.p_Bloqueos ADD creadoEn DATETIME DEFAULT GETDATE();
        
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.p_Bloqueos') AND name = 'idOrigenUsuario')
        ALTER TABLE dbo.p_Bloqueos ADD idOrigenUsuario INT NULL; -- Nullable temporalmente si hay datos
        
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.p_Bloqueos') AND name = 'idDestinoUsuario')
        ALTER TABLE dbo.p_Bloqueos ADD idDestinoUsuario INT NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.p_Bloqueos') AND name = 'destinoTexto')
        ALTER TABLE dbo.p_Bloqueos ADD destinoTexto NVARCHAR(200) NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.p_Bloqueos') AND name = 'motivo')
        ALTER TABLE dbo.p_Bloqueos ADD motivo NVARCHAR(1000) NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.p_Bloqueos') AND name = 'accionMitigacion')
        ALTER TABLE dbo.p_Bloqueos ADD accionMitigacion NVARCHAR(1000) NULL;
END
GO

/* =========================================================
   CONSTRAINTS / ÍNDICES (CRÍTICO para Upsert sin duplicados)
   ========================================================= */

-- 1) Un solo checkin por usuario por día
IF NOT EXISTS (
  SELECT 1 FROM sys.indexes 
  WHERE name = 'UX_p_Checkins_idUsuario_fecha' AND object_id = OBJECT_ID('dbo.p_Checkins')
)
BEGIN
  CREATE UNIQUE INDEX UX_p_Checkins_idUsuario_fecha
  ON dbo.p_Checkins(idUsuario, fecha);
END
GO

-- 2) Buscar bloqueo activo por tarea rápido
IF NOT EXISTS (
  SELECT 1 FROM sys.indexes 
  WHERE name = 'IX_p_Bloqueos_idTarea_estado' AND object_id = OBJECT_ID('dbo.p_Bloqueos')
)
BEGIN
  CREATE INDEX IX_p_Bloqueos_idTarea_estado
  ON dbo.p_Bloqueos(idTarea, estado)
  INCLUDE(creadoEn, idBloqueo);
END
GO

-- 3) CheckinTareas: evitar duplicados (mismo checkin + tarea + tipo)
IF NOT EXISTS (
  SELECT 1 FROM sys.indexes 
  WHERE name = 'UX_p_CheckinTareas_Checkin_Tarea_Tipo' AND object_id = OBJECT_ID('dbo.p_CheckinTareas')
)
BEGIN
  CREATE UNIQUE INDEX UX_p_CheckinTareas_Checkin_Tarea_Tipo
  ON dbo.p_CheckinTareas(idCheckin, idTarea, tipo);
END
GO

-- TIPO TVP PARA DETALLE DE CHECKIN (MIGRACIÓN ZERO INLINE)
IF TYPE_ID(N'TVP_CheckinTareas') IS NULL
BEGIN
    CREATE TYPE dbo.TVP_CheckinTareas AS TABLE
    (
        idTarea INT NOT NULL,
        tipo    NVARCHAR(20) NOT NULL -- 'Entrego' | 'Avanzo' | 'Extra'
    );
END
GO

/* =========================================================
   2) SP Mejorado: sp_Checkin_Upsert
   ========================================================= */
CREATE OR ALTER PROCEDURE dbo.sp_Checkin_Upsert
(
    @idUsuario        INT,
    @fecha            DATE,
    @entregableTexto  NVARCHAR(4000),
    @nota             NVARCHAR(4000) = NULL,
    @linkEvidencia    NVARCHAR(1000) = NULL,
    @estadoAnimo      NVARCHAR(50) = NULL,
    @idNodo           INT = NULL,
    @tareas           dbo.TVP_CheckinTareas READONLY
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON; 

    BEGIN TRY
        BEGIN TRAN;

        DECLARE @idCheckin INT;

        SELECT @idCheckin = c.idCheckin
        FROM dbo.p_Checkins c WITH (UPDLOCK, HOLDLOCK)
        WHERE c.idUsuario = @idUsuario AND c.fecha = @fecha;

        IF @idCheckin IS NULL
        BEGIN
            INSERT INTO dbo.p_Checkins(idUsuario, fecha, entregableTexto, nota, linkEvidencia, estadoAnimo, idNodo)
            VALUES(@idUsuario, @fecha, @entregableTexto, @nota, @linkEvidencia, @estadoAnimo, @idNodo);

            SET @idCheckin = SCOPE_IDENTITY();
        END
        ELSE
        BEGIN
            UPDATE dbo.p_Checkins
            SET entregableTexto = @entregableTexto,
                nota = @nota,
                linkEvidencia = @linkEvidencia,
                estadoAnimo = @estadoAnimo,
                idNodo = @idNodo
            WHERE idCheckin = @idCheckin;
        END

        DELETE FROM dbo.p_CheckinTareas WHERE idCheckin = @idCheckin;

        INSERT INTO dbo.p_CheckinTareas(idCheckin, idTarea, tipo)
        SELECT
            @idCheckin,
            x.idTarea,
            x.tipo
        FROM (
            SELECT DISTINCT idTarea, tipo
            FROM @tareas
        ) x
        INNER JOIN dbo.p_Tareas t ON t.idTarea = x.idTarea
        WHERE t.activo = 1;

        COMMIT;

        SELECT @idCheckin AS idCheckin;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        THROW;
    END CATCH
END
GO

/* =========================================================
   3) SP Mejorado: sp_Bloqueo_Crear
   ========================================================= */
CREATE OR ALTER PROCEDURE dbo.sp_Bloqueo_Crear
(
    @idTarea          INT,
    @idOrigenUsuario  INT,
    @idDestinoUsuario INT = NULL,
    @destinoTexto     NVARCHAR(200) = NULL,
    @motivo           NVARCHAR(1000),
    @accionMitigacion NVARCHAR(1000) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRAN;

        DECLARE @idBloqueo INT;

        SELECT TOP (1) @idBloqueo = b.idBloqueo
        FROM dbo.p_Bloqueos b WITH (UPDLOCK, HOLDLOCK)
        WHERE b.idTarea = @idTarea AND b.estado <> 'Resuelto'
        ORDER BY b.creadoEn DESC;

        IF @idBloqueo IS NULL
        BEGIN
            INSERT INTO dbo.p_Bloqueos
            (idTarea, idOrigenUsuario, idDestinoUsuario, destinoTexto, motivo, accionMitigacion, creadoEn, estado)
            VALUES
            (@idTarea, @idOrigenUsuario, @idDestinoUsuario, @destinoTexto, @motivo, @accionMitigacion, GETDATE(), 'Activo');

            SET @idBloqueo = SCOPE_IDENTITY();
        END

        SELECT @idBloqueo AS idBloqueo;
        
        -- Actualizar estado tarea (fuera del INSERT para asegurar que se ejecute incluso si devolvimos bloqueo existente, aunque la regla de negocio podria variar)
        -- En este caso, aseguramos que la tarea se marque bloqueada.
        UPDATE dbo.p_Tareas
        SET estado = 'Bloqueada'
        WHERE idTarea = @idTarea
          AND activo = 1
          AND estado NOT IN ('Hecha', 'Archivada');

        COMMIT;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        THROW;
    END CATCH
END
GO

/* =========================================================
   4) SP Mejorado: sp_Tarea_CrearCompleta
   ========================================================= */
CREATE OR ALTER PROCEDURE dbo.sp_Tarea_CrearCompleta
(
    @nombre NVARCHAR(255),
    @idUsuario INT,
    @idProyecto INT = NULL,
    @descripcion NVARCHAR(MAX) = NULL,
    @estado NVARCHAR(50) = 'Pendiente',
    @prioridad NVARCHAR(50) = 'Media',
    @esfuerzo NVARCHAR(50) = NULL,
    @tipo NVARCHAR(50) = 'Administrativa',
    @fechaInicioPlanificada DATETIME = NULL,
    @fechaObjetivo DATETIME = NULL,
    @porcentaje INT = 0,
    @orden INT = 0,
    @comportamiento NVARCHAR(50) = NULL,
    @idTareaPadre INT = NULL,
    @idResponsable INT = NULL,
    @requiereEvidencia BIT = 0,
    @idEntregable INT = NULL
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRAN;

        IF @fechaObjetivo IS NULL
            SET @fechaObjetivo = GETDATE();

        IF @idTareaPadre IS NOT NULL
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM dbo.p_Tareas p
                WHERE p.idTarea = @idTareaPadre
                  AND p.activo = 1
            )
            BEGIN
                THROW 50001, 'idTareaPadre inválido o no existe.', 1;
            END
        END

        INSERT INTO dbo.p_Tareas (
            nombre, idCreador, idProyecto, descripcion, estado, prioridad, esfuerzo, tipo,
            fechaInicioPlanificada, fechaObjetivo, porcentaje, orden, comportamiento,
            idTareaPadre, requiereEvidencia, idEntregable, fechaCreacion, activo
        )
        VALUES (
            @nombre, @idUsuario, @idProyecto, @descripcion, @estado, @prioridad, @esfuerzo, @tipo,
            @fechaInicioPlanificada, @fechaObjetivo, @porcentaje, @orden, @comportamiento,
            @idTareaPadre, @requiereEvidencia, @idEntregable, GETDATE(), 1
        );

        DECLARE @idTarea INT = SCOPE_IDENTITY();

        IF @idResponsable IS NOT NULL AND @idResponsable <> @idUsuario
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM dbo.p_TareaAsignados 
                WHERE idTarea = @idTarea AND idUsuario = @idResponsable AND tipo = 'Responsable'
            )
            BEGIN
                INSERT INTO dbo.p_TareaAsignados (idTarea, idUsuario, tipo, fechaAsignacion)
                VALUES (@idTarea, @idResponsable, 'Responsable', GETDATE());
            END
        END

        COMMIT;
        SELECT @idTarea AS idTarea;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        THROW;
    END CATCH
END
GO
