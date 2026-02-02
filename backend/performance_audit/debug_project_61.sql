-- =============================================
-- DIAGNÓSTICO ESPECÍFICO: PROYECTO 61 vs USUARIO 400103
-- Objetivo: Descubrir por qué debería verlo (o no)
-- =============================================

DECLARE @idProyecto INT = 61;
DECLARE @LiderCarnet NVARCHAR(50) = '400103';

PRINT '=== ANALISIS DE PROYECTO ' + CAST(@idProyecto AS NVARCHAR) + ' ===';

-- 1. DATOS DEL PROYECTO
SELECT idProyecto, nombre, estado, idCreador, p.fechaCreacion 
FROM p_Proyectos p WHERE idProyecto = @idProyecto;

-- 2. QUIÉN LO CREÓ (¿Es subordinado?)
DECLARE @idCreador INT;
SELECT @idCreador = idCreador FROM p_Proyectos WHERE idProyecto = @idProyecto;

SELECT 
    u.idUsuario, u.carnet, u.nombre, u.jefeCarnet,
    EsSubordinado = CASE WHEN u.jefeCarnet = @LiderCarnet THEN 'SI (Directo)' ELSE 'NO (o Indirecto)' END
FROM p_Usuarios u WHERE idUsuario = @idCreador;


-- 3. PARTICIPANTES (¿Hay subordinados con tareas?)
PRINT ' ';
PRINT '=== PARTICIPANTES DEL PROYECTO (Con Tareas) ===';

SELECT 
    t.idTarea, t.nombre as Tarea, 
    ta.tipo, ta.carnet as CarnetParticipante, u.nombre as NombreParticipante,
    u.jefeCarnet as JefeDelParticipante,
    CASE 
        WHEN u.jefeCarnet = @LiderCarnet THEN '!!! ES SUBORDINADO DIRECTO !!!'
        WHEN u.carnet = @LiderCarnet THEN '!!! ES ELLA MISMA !!!'
        ELSE 'Otro'
    END as Relacion
FROM p_Tareas t
INNER JOIN p_TareaAsignados ta ON t.idTarea = ta.idTarea
INNER JOIN p_Usuarios u ON ta.carnet = u.carnet
WHERE t.idProyecto = @idProyecto
  AND t.activo = 1;


-- 4. VERIFICAR JERARQUÍA COMPLETA (¿Es subordinado indirecto?)
PRINT ' ';
PRINT '=== BUSCANDO SI ALGÚN PARTICIPANTE ES SUBORDINADO INDIRECTO ===';

-- Reconstruimos su jerarquía real
WITH Jerarquia AS (
    SELECT u.idUsuario, u.carnet, u.nombre, u.jefeCarnet, 1 as Nivel
    FROM p_Usuarios u
    WHERE u.jefeCarnet = @LiderCarnet AND u.activo = 1
    
    UNION ALL
    
    SELECT u.idUsuario, u.carnet, u.nombre, u.jefeCarnet, j.Nivel + 1
    FROM p_Usuarios u
    INNER JOIN Jerarquia j ON u.jefeCarnet = j.carnet
    WHERE u.activo = 1
)
SELECT 
    J.*, 
    TIENE_TAREA_EN_61 = CASE 
        WHEN EXISTS(
            SELECT 1 FROM p_Tareas t 
            JOIN p_TareaAsignados ta ON t.idTarea = ta.idTarea
            WHERE t.idProyecto = @idProyecto AND ta.carnet = J.carnet
        ) THEN 'SI, TIENE TAREA (Esta es la razón de visibilidad)'
        
        WHEN EXISTS(SELECT 1 FROM p_Proyectos p WHERE p.idProyecto = @idProyecto AND p.idCreador = J.idUsuario)
             THEN 'SI, ES CREADOR (Esta es la razón de visibilidad)'
             
        ELSE 'NO'
    END
FROM Jerarquia J
WHERE EXISTS (
    SELECT 1 FROM p_Tareas t 
    JOIN p_TareaAsignados ta ON t.idTarea = ta.idTarea
    WHERE t.idProyecto = @idProyecto AND ta.carnet = J.carnet
) 
OR EXISTS(SELECT 1 FROM p_Proyectos p WHERE p.idProyecto = @idProyecto AND p.idCreador = J.idUsuario);
