-- =============================================
-- CONSULTA CALENDARIO (DEBUG)
-- Simula la llamada de sp_Tareas_ObtenerPorUsuario con un rango de fechas (semana)
-- =============================================

DECLARE @carnet NVARCHAR(50) = 'TU_CARNET_AQUI'; -- CAMBIAR POR TU CARNET
DECLARE @fechaInicio DATE = '2026-01-26'; -- Lunes de esta semana (ajustar)
DECLARE @fechaFin    DATE = '2026-02-01'; -- Domingo de esta semana (ajustar)

PRINT 'Consultando Calendario para: ' + @carnet
PRINT 'Desde: ' + CAST(@fechaInicio AS NVARCHAR)
PRINT 'Hasta: ' + CAST(@fechaFin AS NVARCHAR)

SELECT 
    t.idTarea, 
    t.nombre as titulo,
    t.fechaObjetivo,
    t.estado,
    t.creadorCarnet,
    ta.carnet as asignadoA
FROM p_Tareas t
LEFT JOIN p_TareaAsignados ta ON t.idTarea = ta.idTarea
WHERE t.activo = 1
  -- Filtro de Propiedad (Creador o Asignado)
  AND (t.creadorCarnet = @carnet OR ta.carnet = @carnet)
  
  -- Filtro de Fechas (Rango del Calendario)
  AND t.fechaObjetivo >= @fechaInicio 
  AND t.fechaObjetivo <= @fechaFin
  
ORDER BY t.fechaObjetivo ASC;
