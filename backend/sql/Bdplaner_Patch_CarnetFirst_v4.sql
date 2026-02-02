
/* ========================================================================
   Bdplaner_Patch_CarnetFirst_v4_2026-01-25.sql (Reconstrucción)
   Objetivo: Implementar estrategia 'Carnet-First' consistente y alinear SPs 
   con la estructura real detectada en la auditoría.
   ======================================================================== */

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

/* ========================================================================
   1. CAMBIOS ESTRUCTURALES Y VALIDACIONES (DDL)
   ======================================================================== */

-- 1.1 Asegurar que p_Usuarios tiene índice único por carnet (si ya existen datos limpios)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_p_Usuarios_carnet' AND object_id = OBJECT_ID('dbo.p_Usuarios'))
BEGIN
    -- Intentar crear índice único. Si falla por duplicados, el usuario deberá limpiar manualmente o usar el script de limpieza anterior.
    -- Se usa un índice filtrado para permitir NULLs solo si fuera necesario, pero idealmente carnet es NOT NULL.
    -- Asumimos limpieza previa.
    BEGIN TRY
        CREATE UNIQUE INDEX UX_p_Usuarios_carnet ON dbo.p_Usuarios(carnet) WHERE carnet IS NOT NULL;
    END TRY
    BEGIN CATCH
        PRINT 'Advertencia: No se pudo crear índice único en carnet (posibles duplicados). Se continúa.';
    END CATCH
END
GO

-- 1.2 Backfill/Columnas de Carnet en tablas principales (Idempotente)
-- p_Tareas
IF COL_LENGTH('dbo.p_Tareas', 'creadorCarnet') IS NULL ALTER TABLE dbo.p_Tareas ADD creadorCarnet NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.p_Tareas', 'asignadoCarnet') IS NULL ALTER TABLE dbo.p_Tareas ADD asignadoCarnet NVARCHAR(50) NULL;
-- p_Checkins
IF COL_LENGTH('dbo.p_Checkins', 'usuarioCarnet') IS NULL ALTER TABLE dbo.p_Checkins ADD usuarioCarnet NVARCHAR(50) NULL;

GO

/* ========================================================================
   2. SP UTILITARIOS (Resolución ID <-> Carnet)
   ======================================================================== */

CREATE OR ALTER PROCEDURE dbo.sp_Usuarios_ObtenerIdPorCarnet
    @carnet NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT idUsuario, nombreCompleto, correo, rol 
    FROM dbo.p_Usuarios 
    WHERE carnet = @carnet;
END
GO

/* ========================================================================
   3. SPs 'CARNET-FIRST' (Nuevas versiones alineadas)
   ======================================================================== */

-- 3.1 sp_Checkin_Upsert_v2 (Alineado a estructura real p_Checkins)
-- Campos detectados: prioridad1/2/3, entregableTexto, nota, energia, estadoAnimo, comentarios, estado, linkEvidencia, idNodo.
CREATE OR ALTER PROCEDURE dbo.sp_Checkin_Upsert_v2
(
    @usuarioCarnet   NVARCHAR(50),
    @fecha           DATE,
    @prioridad1      NVARCHAR(255) = NULL,
    @prioridad2      NVARCHAR(255) = NULL,
    @prioridad3      NVARCHAR(255) = NULL,
    @entregableTexto NVARCHAR(MAX) = NULL,
    @nota            NVARCHAR(MAX) = NULL,
    @linkEvidencia   NVARCHAR(1000) = NULL,
    @estadoAnimo     NVARCHAR(50) = NULL,
    @energia         INT = NULL,
    @idNodo          INT = NULL,
    -- TVP opcional si se manda detalle de tareas en mismo viaje
    @tareas          dbo.TVP_CheckinTareas READONLY 
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @idUsuario INT;
    SELECT @idUsuario = idUsuario FROM dbo.p_Usuarios WHERE carnet = @usuarioCarnet;

    IF @idUsuario IS NULL
    BEGIN
        THROW 50001, 'Usuario no encontrado por carnet.', 1;
    END

    BEGIN TRY
        BEGIN TRAN;

        DECLARE @idCheckin INT;

        -- Buscar existente
        SELECT @idCheckin = idCheckin 
        FROM dbo.p_Checkins WITH (UPDLOCK, HOLDLOCK)
        WHERE idUsuario = @idUsuario AND CAST(fecha AS DATE) = @fecha;

        IF @idCheckin IS NULL
        BEGIN
            INSERT INTO dbo.p_Checkins(
                idUsuario, usuarioCarnet, fecha, 
                prioridad1, prioridad2, prioridad3, 
                entregableTexto, nota, linkEvidencia, 
                estadoAnimo, energia, idNodo
            )
            VALUES(
                @idUsuario, @usuarioCarnet, @fecha,
                @prioridad1, @prioridad2, @prioridad3,
                @entregableTexto, @nota, @linkEvidencia,
                @estadoAnimo, @energia, @idNodo
            );
            SET @idCheckin = SCOPE_IDENTITY();
        END
        ELSE
        BEGIN
            UPDATE dbo.p_Checkins
            SET 
                prioridad1 = @prioridad1,
                prioridad2 = @prioridad2,
                prioridad3 = @prioridad3,
                entregableTexto = @entregableTexto,
                nota = @nota,
                linkEvidencia = @linkEvidencia,
                estadoAnimo = @estadoAnimo,
                energia = @energia,
                idNodo = @idNodo
            WHERE idCheckin = @idCheckin;
        END

        -- Actualizar Detalle Tareas (si viene TVP)
        -- Nota: Verificamos si TVP tiene filas antes de borrar, o borramos siempre?
        -- Regla: Si se manda TVP, es un reemplazo completo. Si viene vacío, ¿se borran?
        -- Asumiremos que el frontend manda todas las tareas del día.
        IF EXISTS (SELECT 1 FROM @tareas)
        BEGIN
             DELETE FROM dbo.p_CheckinTareas WHERE idCheckin = @idCheckin;
             
             INSERT INTO dbo.p_CheckinTareas(idCheckin, idTarea, tipo)
             SELECT @idCheckin, t.idTarea, t.tipo
             FROM @tareas t
             INNER JOIN dbo.p_Tareas pt ON pt.idTarea = t.idTarea -- Validar existencia
             WHERE pt.activo = 1;
        END

        COMMIT;
        SELECT @idCheckin as idCheckin;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        THROW;
    END CATCH
END
GO

-- 3.2 sp_Tarea_Crear_Carnet (Wrapper o implementación directa)
CREATE OR ALTER PROCEDURE dbo.sp_Tarea_Crear_Carnet
(
    @creadorCarnet NVARCHAR(50),
    @titulo NVARCHAR(255),
    @descripcion NVARCHAR(MAX) = NULL,
    @idProyecto INT = NULL,
    @prioridad NVARCHAR(50) = 'Media',
    @fechaObjetivo DATETIME = NULL
)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @idUsuario INT;
    SELECT @idUsuario = idUsuario FROM dbo.p_Usuarios WHERE carnet = @creadorCarnet;

    IF @idUsuario IS NULL THROW 50001, 'Creador no encontrado.', 1;

    -- Reutiliza lógica de inserción (podríamos llamar a sp_Tarea_CrearCompleta interno, 
    -- pero para eficiencia y carnet-first lo hacemos directo aquí o en sp_Tarea_CrearCompleta_Carnet)
    
    INSERT INTO dbo.p_Tareas(
        nombre, descripcion, idProyecto, 
        idCreador, creadorCarnet, 
        prioridad, fechaObjetivo, 
        estado, fechaCreacion, activo
    )
    VALUES(
        @titulo, @descripcion, @idProyecto,
        @idUsuario, @creadorCarnet,
        @prioridad, ISNULL(@fechaObjetivo, GETDATE()),
        'Pendiente', GETDATE(), 1
    );

    SELECT SCOPE_IDENTITY() as idTarea;
END
GO

-- 3.3 sp_Clarity_MiDia_Get_Carnet
CREATE OR ALTER PROCEDURE dbo.sp_Clarity_MiDia_Get_Carnet
    @carnet NVARCHAR(50),
    @fecha DATE
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @idUsuario INT;
    SELECT @idUsuario = idUsuario FROM dbo.p_Usuarios WHERE carnet = @carnet;

    -- Retorna lo mismo que sp_Clarity_MiDia_Get pero resolviendo usuario
    -- (Asumiendo que existe sp_Clarity_MiDia_Get, lo invocamos o replicamos lógica)
    -- Por eficiencia, replicamos la query principal:
    
    -- 1. Tareas del día (fechaObjetivo <= hoy y no terminadas, o terminadas hoy)
    SELECT t.*, p.nombre as nombreProyecto
    FROM dbo.p_Tareas t
    LEFT JOIN dbo.p_Proyectos p ON p.idProyecto = t.idProyecto
    WHERE t.idCreador = @idUsuario
      AND t.activo = 1
      AND (
          (t.estado NOT IN ('Hecha', 'Archivada') AND cast(t.fechaObjetivo as date) <= @fecha)
          OR
          (t.estado = 'Hecha' AND cast(t.fechaFinalizacion as date) = @fecha)
      )
    ORDER BY t.prioridad DESC, t.fechaObjetivo ASC;

    -- 2. Checkin del día
    SELECT * FROM dbo.p_Checkins WHERE idUsuario = @idUsuario AND cast(fecha as date) = @fecha;
END
GO
