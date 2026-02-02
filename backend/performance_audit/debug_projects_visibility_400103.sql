-- =============================================
-- SIMULACIÓN DE VISIBILIDAD DE PROYECTOS (Usuario 400103)
-- Objetivo: Ver qué proyectos le aparecen en el listado y entender POR QUÉ.
-- =============================================

DECLARE @carnet NVARCHAR(50) = '400103'; 

PRINT '---------------------------------------------------------'
PRINT 'Simulando Visibilidad para: ' + @carnet
PRINT '---------------------------------------------------------'

-- 1. DETECTAR SU EQUIPO (Jerarquía: Ella + Subordinados + Subordinados de subordinados...)
DECLARE @MiEquipo TABLE (idUsuario INT, carnet NVARCHAR(50), nombre NVARCHAR(100), RolEnEquipo NVARCHAR(50));

-- A. Insertarla a ella misma (Líder)
INSERT INTO @MiEquipo (idUsuario, carnet, nombre, RolEnEquipo)
SELECT idUsuario, carnet, nombre, 'LIDER (Ella misma)' 
FROM p_Usuarios WHERE carnet = @carnet;

-- B. Insertar subordinados (Recursivo)
WITH Jerarquia AS (
    -- Nivel 1: Subordinados directos
    SELECT u.idUsuario, u.carnet, u.nombre, u.jefeCarnet, 1 as Nivel
    FROM p_Usuarios u
    WHERE u.jefeCarnet = @carnet AND u.activo = 1
    
    UNION ALL
    
    -- Nivel N: Subordinados de los de abajo
    SELECT u.idUsuario, u.carnet, u.nombre, u.jefeCarnet, j.Nivel + 1
    FROM p_Usuarios u
    INNER JOIN Jerarquia j ON u.jefeCarnet = j.carnet
    WHERE u.activo = 1
)
INSERT INTO @MiEquipo (idUsuario, carnet, nombre, RolEnEquipo)
SELECT idUsuario, carnet, nombre, 'Subordinado Nvl ' + CAST(Nivel AS NVARCHAR) 
FROM Jerarquia;

-- Mostrar quiénes conforman su "Ojo de Dios" (a quiénes ve)
PRINT 'Miembros del Equipo detectados (cuyos proyectos ella verá):'
SELECT * FROM @MiEquipo;


-- 2. BUSCAR PROYECTOS VISIBLES
--    Regla: Muestro el proyecto SI (Alguien de mi equipo lo creó) O (Alguien de mi equipo tiene tarea ahí)

PRINT '---------------------------------------------------------'
PRINT 'Proyectos Visibles:'
PRINT '---------------------------------------------------------'

SELECT DISTINCT
    p.idProyecto,
    p.nombre as Proyecto,
    p.estado,
    p.gerencia,
    uc.nombre as CreadorProyecto,
    
    -- EXPLICACIÓN: ¿Por qué lo veo?
    CASE 
        WHEN p.idCreador IN (SELECT idUsuario FROM @MiEquipo) 
            THEN 'PROPIO/EQUIPO (' + uc.nombre + ' lo creó)'
        ELSE 'COLABORACIÓN (Equipo tiene tareas)' 
    END as CausaVisibilidad,

    -- Detalle extra: ¿Quién de mi equipo está metido ahí?
    (
        SELECT TOP 1 e.nombre + ' (' + ta.tipo + ')'
        FROM @MiEquipo e
        JOIN p_TareaAsignados ta ON ta.carnet = e.carnet
        JOIN p_Tareas t ON t.idTarea = ta.idTarea
        WHERE t.idProyecto = p.idProyecto
    ) as EjemploParticipanteEquipo

FROM p_Proyectos p
LEFT JOIN p_Usuarios uc ON p.idCreador = uc.idUsuario
-- Join para buscar tareas asignadas al equipo
LEFT JOIN p_Tareas t ON p.idProyecto = t.idProyecto
LEFT JOIN p_TareaAsignados ta ON t.idTarea = ta.idTarea

WHERE 
    p.estado != 'Eliminado'
    AND
    (
        -- A. Creado por mi equipo (incluyéndome)
        p.idCreador IN (SELECT idUsuario FROM @MiEquipo)
        
        OR 
        
        -- B. Tarea asignada a mi equipo
        ta.carnet IN (SELECT carnet FROM @MiEquipo)
    )
ORDER BY p.idProyecto DESC;
