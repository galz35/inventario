USE [Bdplaner];
GO
SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

/*
  FIX ISSUE V2: Leader lost visibility of own projects because @idsEquipo might not include the leader's ID.
  Solution: Explicitly check p.idCreador = @idUsuario OR p.idCreador IN @idsEquipo.
*/

CREATE OR ALTER PROCEDURE dbo.sp_Proyecto_ObtenerVisibles
(
    @idUsuario INT,
    @idsEquipo dbo.TVP_IntList READONLY, -- Lista de IDs (Subordinados + Quizás Yo)
    @nombre    NVARCHAR(100) = NULL,
    @estado    NVARCHAR(50) = NULL,
    @gerencia  NVARCHAR(100) = NULL,
    @area      NVARCHAR(100) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT DISTINCT p.*,
        progreso = ISNULL((
            SELECT ROUND(AVG(CAST(CASE WHEN t.estado = 'Hecha' THEN 100 ELSE ISNULL(t.porcentaje, 0) END AS FLOAT)), 0)
            FROM dbo.p_Tareas t
            WHERE t.idProyecto = p.idProyecto 
              AND t.idTareaPadre IS NULL 
              AND t.activo = 1
              AND t.estado NOT IN ('Descartada', 'Eliminada', 'Anulada', 'Cancelada')
        ), 0)
    FROM dbo.p_Proyectos p
    WHERE 
        p.estado <> 'Eliminado'
        AND
        (
            -- 1. Soy el Creador (Seguro de vida)
            p.idCreador = @idUsuario
            
            -- 2. Alguien de mi equipo es Creador
            OR p.idCreador IN (SELECT Id FROM @idsEquipo)
            
            -- 3. Alguien de mi equipo (o yo) tiene tareas asignadas
            OR EXISTS (
                SELECT 1
                FROM dbo.p_Tareas t
                INNER JOIN dbo.p_TareaAsignados ta ON ta.idTarea = t.idTarea
                INNER JOIN @idsEquipo team ON team.Id = ta.idUsuario
                WHERE t.idProyecto = p.idProyecto
            )
            
            -- 4. Yo tengo tarea asignada (Seguro de vida por si no estoy en @idsEquipo)
            OR EXISTS (
                SELECT 1
                FROM dbo.p_Tareas t
                INNER JOIN dbo.p_TareaAsignados ta ON ta.idTarea = t.idTarea
                WHERE t.idProyecto = p.idProyecto AND ta.idUsuario = @idUsuario
            )
        )
        AND (@nombre IS NULL OR p.nombre LIKE '%' + @nombre + '%')
        AND (@estado IS NULL OR p.estado = @estado)
        AND (@gerencia IS NULL OR p.gerencia = @gerencia)
        AND (@area IS NULL OR p.area = @area)
    ORDER BY p.fechaCreacion DESC
    OPTION (RECOMPILE);
END
GO
