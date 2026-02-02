-- =============================================
-- CONSULTA PROYECTOS VISIBLES (Usuario 500708)
-- Simula la llamada de sp_Proyecto_ObtenerVisibles
-- Lógica: Ver mis proyectos + proyectos de mi equipo
-- =============================================

DECLARE @carnet NVARCHAR(50) = '500708'; 

PRINT 'Simulando Visibilidad de Proyectos para: ' + @carnet

-- 1. OBTENER MI EQUIPO (Jerarquía y visibilidad)
--    (Simulación simplificada de la lógica de VisibilidadService)
DECLARE @MiEquipo TABLE (idUsuario INT, carnet NVARCHAR(50));

-- Me inserto a mí mismo primero
INSERT INTO @MiEquipo (idUsuario, carnet)
SELECT idUsuario, carnet FROM p_Usuarios WHERE carnet = @carnet;

-- Inserto subordinados directos e indirectos (Jerarquía)
-- (Esta es una CTE recursiva estándar de tu sistema)
WITH Jerarquia AS (
    SELECT idUsuario, carnet, jefeCarnet
    FROM p_Usuarios
    WHERE jefeCarnet = @carnet AND activo = 1
    
    UNION ALL
    
    SELECT u.idUsuario, u.carnet, u.jefeCarnet
    FROM p_Usuarios u
    INNER JOIN Jerarquia j ON u.jefeCarnet = j.carnet
    WHERE u.activo = 1
)
INSERT INTO @MiEquipo (idUsuario, carnet)
SELECT idUsuario, carnet FROM Jerarquia;

-- Opcional: Mostrar equipo detectado
-- SELECT * FROM @MiEquipo;

-- 2. LISTAR PROYECTOS VISIBLES
--    Regla: Proyecto Creado por alguien del equipo O Tarea Asignada a alguien del equipo
SELECT DISTINCT
    p.idProyecto,
    p.nombre,
    p.descripcion,
    p.estado,
    p.prioridad,
    p.progreso,
    p.fechaInicio,
    p.fechaFin,
    p.gerencia, 
    p.subgerencia, 
    p.area,
    uc.nombre as Creador,
    CASE WHEN p.idCreador IN (SELECT idUsuario FROM @MiEquipo) THEN 'Creado por Equipo' ELSE 'Tarea Asignada' END as MotivoVisibilidad
FROM p_Proyectos p
LEFT JOIN p_Usuarios uc ON p.idCreador = uc.idUsuario
LEFT JOIN p_Tareas t ON p.idProyecto = t.idProyecto
LEFT JOIN p_TareaAsignados ta ON t.idTarea = ta.idTarea
WHERE 
    p.estado != 'Eliminado'
    AND
    (
        -- A. Creado por alguien de mi equipo (incluyéndome)
        p.idCreador IN (SELECT idUsuario FROM @MiEquipo)
        
        OR 
        
        -- B. Alguien de mi equipo tiene tarea asignada en ese proyecto
        ta.carnet IN (SELECT carnet FROM @MiEquipo)
    )
ORDER BY p.idProyecto DESC;
