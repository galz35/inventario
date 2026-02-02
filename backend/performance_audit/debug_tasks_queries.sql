-- =============================================
-- CONSULTA 1: TAREAS DE HOY (PRINCIPAL)
-- Esta es la lógica que alimenta el "Mi Día"
-- Equivale a sp_Tareas_ObtenerPorUsuario con filtros de fecha
-- =============================================

DECLARE @carnet NVARCHAR(50) = 'TU_CARNET_AQUI'; -- CAMBIAR POR TU CARNET
DECLARE @fechaHoy DATE = CAST(GETDATE() AS DATE);

-- Usamos tabla temporal para maximizar performance (como en el SP optimizado)
IF OBJECT_ID('tempdb..#TareasHoy') IS NOT NULL DROP TABLE #TareasHoy;

CREATE TABLE #TareasHoy (idTarea INT PRIMARY KEY);

-- A. Tareas donde soy Creador o Asignado para HOY
INSERT INTO #TareasHoy (idTarea)
SELECT t.idTarea
FROM p_Tareas t
WHERE t.activo = 1
  AND t.creadorCarnet = @carnet
  AND t.fechaObjetivo >= @fechaHoy AND t.fechaObjetivo < DATEADD(day, 1, @fechaHoy)
UNION
SELECT t.idTarea
FROM p_Tareas t
INNER JOIN p_TareaAsignados ta ON t.idTarea = ta.idTarea
WHERE t.activo = 1
  AND ta.carnet = @carnet
  AND t.fechaObjetivo >= @fechaHoy AND t.fechaObjetivo < DATEADD(day, 1, @fechaHoy);

-- B. Tareas que YO decidí poner en mi Agenda de HOY (aunque sean viejas)
INSERT INTO #TareasHoy (idTarea)
SELECT ct.idTarea
FROM p_CheckinTareas ct
INNER JOIN p_Checkins c ON ct.idCheckin = c.idCheckin
WHERE c.usuarioCarnet = @carnet
  AND c.fecha = @fechaHoy
  AND NOT EXISTS (SELECT 1 FROM #TareasHoy h WHERE h.idTarea = ct.idTarea);

-- RESULTADO FINAL HOY
SELECT 
    'HOY' as origen,
    t.idTarea, t.nombre as titulo, t.estado, t.fechaObjetivo
FROM #TareasHoy x
INNER JOIN p_Tareas t ON x.idTarea = t.idTarea;


-- =============================================
-- CONSULTA 2: BACKLOG (TAREAS ATRASADAS)
-- Lógica ajustada para usar EXISTS en lugar de LEFT JOIN masivos
-- =============================================

PRINT '-----------------------------------------'
PRINT 'CONSULTA BACKLOG (ATRASADAS)'
PRINT '-----------------------------------------'

SELECT 
    t.idTarea, 
    t.nombre as titulo,
    t.estado,
    t.fechaObjetivo,
    t.fechaCreacion,
    p.nombre as proyecto
FROM p_Tareas t
LEFT JOIN p_Proyectos p ON t.idProyecto = p.idProyecto
WHERE t.activo = 1
  -- Solo pendientes
  AND t.estado NOT IN ('Hecha', 'Descartada', 'Eliminada')
  
  -- PROPIEDAD: Soy Creador O Asignado O Estuvo en mis Checkins
  AND (
      t.creadorCarnet = @carnet
      OR EXISTS (SELECT 1 FROM p_TareaAsignados ta WHERE ta.idTarea = t.idTarea AND ta.carnet = @carnet)
      OR EXISTS (
          SELECT 1 FROM p_CheckinTareas ct 
          INNER JOIN p_Checkins c ON ct.idCheckin = c.idCheckin 
          WHERE ct.idTarea = t.idTarea AND c.usuarioCarnet = @carnet
      )
  )

  -- CONDICIÓN DE ATRASO
  AND (
      -- 1. Venció ayer o antes
      t.fechaObjetivo < @fechaHoy
      
      -- 2. No tiene vencimiento pero se creó antes
      OR (t.fechaObjetivo IS NULL AND t.fechaCreacion < @fechaHoy)
      
      -- 3. Estuvo en un check-in anterior (ayer o antes)
      OR EXISTS (
          SELECT 1 
          FROM p_CheckinTareas ct2
          INNER JOIN p_Checkins c2 ON ct2.idCheckin = c2.idCheckin
          WHERE ct2.idTarea = t.idTarea 
            AND c2.usuarioCarnet = @carnet
            AND c2.fecha < @fechaHoy
      )
  )

  -- EXCLUSIÓN: No mostrar si YA está en mi agenda de HOY (para no duplicar visualmente)
  -- Esto en el código lo hago en memoria, pero en SQL sería así:
  AND NOT EXISTS (
      SELECT 1 
      FROM p_CheckinTareas ctHoy 
      INNER JOIN p_Checkins cHoy ON ctHoy.idCheckin = cHoy.idCheckin
      WHERE ctHoy.idTarea = t.idTarea 
        AND cHoy.usuarioCarnet = @carnet
        AND cHoy.fecha = @fechaHoy
  )

ORDER BY COALESCE(t.fechaObjetivo, t.fechaCreacion) ASC;
