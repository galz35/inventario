
-- ========================================================
-- MIGRACIÓN FINAL: CONSOLIDACIÓN DE CARNET EN TODO EL BACKEND
-- Fecha: 2026-01-25
-- ========================================================

-- 1. Agregar columnas carnet donde falten
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Inv_ope_proyecto_tareas' AND COLUMN_NAME = 'creadorCarnet')
    ALTER TABLE Inv_ope_proyecto_tareas ADD creadorCarnet NVARCHAR(50);

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Inv_ope_proyecto_tareas' AND COLUMN_NAME = 'asignadoCarnet')
    ALTER TABLE Inv_ope_proyecto_tareas ADD asignadoCarnet NVARCHAR(50); -- Responsable principal denormalizado

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'p_Notas' AND COLUMN_NAME = 'carnet')
    ALTER TABLE p_Notas ADD carnet NVARCHAR(50);

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Inv_ope_checkin_tareas' AND COLUMN_NAME = 'carnet')
    ALTER TABLE Inv_ope_checkin_tareas ADD carnet NVARCHAR(50);

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Inv_ope_proyecto_bloqueos' AND COLUMN_NAME = 'carnetOrigen')
    ALTER TABLE Inv_ope_proyecto_bloqueos ADD carnetOrigen NVARCHAR(50), carnetDestino NVARCHAR(50);

GO

-- 2. Sincronizar Datos Iniciales
UPDATE t SET t.creadorCarnet = u.carnet FROM Inv_ope_proyecto_tareas t JOIN Inv_seg_usuarios u ON t.idCreador = u.idUsuario WHERE t.creadorCarnet IS NULL;
UPDATE ta SET ta.carnet = u.carnet FROM Inv_ope_proyecto_tarea_asignados ta JOIN Inv_seg_usuarios u ON ta.idUsuario = u.idUsuario WHERE ta.carnet IS NULL;
UPDATE n SET n.carnet = u.carnet FROM p_Notas n JOIN Inv_seg_usuarios u ON n.idUsuario = u.idUsuario WHERE n.carnet IS NULL;
UPDATE c SET c.carnet = u.carnet FROM Inv_ope_checkin_tareas c JOIN Inv_seg_usuarios u ON c.idUsuario = u.idUsuario WHERE c.carnet IS NULL;
UPDATE b SET b.carnetOrigen = u.carnet FROM Inv_ope_proyecto_bloqueos b JOIN Inv_seg_usuarios u ON b.idOrigenUsuario = u.idUsuario WHERE b.carnetOrigen IS NULL;
UPDATE b SET b.carnetDestino = u.carnet FROM Inv_ope_proyecto_bloqueos b JOIN Inv_seg_usuarios u ON b.idDestinoUsuario = u.idUsuario WHERE b.carnetDestino IS NULL;

-- 3. Crear Indices de Altura (Performance)
CREATE INDEX IX_Inv_ope_proyecto_tareas_CreadorCarnet ON Inv_ope_proyecto_tareas(creadorCarnet) WHERE activo = 1;
CREATE INDEX IX_p_TareaAsignados_Carnet ON Inv_ope_proyecto_tarea_asignados(carnet);
CREATE INDEX IX_p_Notas_Carnet ON p_Notas(carnet);
CREATE INDEX IX_p_CheckinTareas_Carnet ON Inv_ope_checkin_tareas(carnet);

GO

-- 4. Actualizar SPs para usar Carnet como parámetro dominante
CREATE OR ALTER PROCEDURE [dbo].[sInv_ope_proyecto_tareas_ObtenerPorUsuario]
    @carnet NVARCHAR(50), 
    @estado NVARCHAR(50) = NULL,
    @idProyecto INT = NULL,
    @query NVARCHAR(100) = NULL,
    @startDate DATETIME = NULL,
    @endDate DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT DISTINCT
        t.*, p.nombre as proyectoNombre 
    FROM Inv_ope_proyecto_tareas t
    LEFT JOIN Inv_ope_proyectos p ON t.idProyecto = p.idProyecto
    LEFT JOIN Inv_ope_proyecto_tarea_asignados ta ON t.idTarea = ta.idTarea
    WHERE (t.creadorCarnet = @carnet OR ta.carnet = @carnet)
      AND (@estado IS NULL OR t.estado = @estado)
      AND (@idProyecto IS NULL OR t.idProyecto = @idProyecto)
      AND (@query IS NULL OR (t.nombre LIKE '%' + @query + '%' OR t.descripcion LIKE '%' + @query + '%'))
      AND (
          (@startDate IS NULL OR @endDate IS NULL) 
          OR (t.fechaObjetivo >= @startDate AND t.fechaObjetivo <= @endDate)
      )
      AND t.activo = 1
    ORDER BY t.fechaObjetivo ASC;
END
GO


