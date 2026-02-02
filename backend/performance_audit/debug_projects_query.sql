-- =============================================
-- CONSULTA PROYECTOS (DEBUG)
-- Simula la llamada de sp_Proyectos_Listar (Vista Admin / Global)
-- =============================================

DECLARE @nombre      NVARCHAR(100) = NULL;
DECLARE @estado      NVARCHAR(50)  = NULL;
DECLARE @gerencia    NVARCHAR(100) = NULL;
DECLARE @subgerencia NVARCHAR(100) = NULL;
DECLARE @area        NVARCHAR(100) = NULL;
DECLARE @tipo        NVARCHAR(50)  = NULL;

-- Paginación (Simulación)
DECLARE @PageNumber INT = 1;
DECLARE @PageSize   INT = 2000;

-- CTE para Paginación y Filtrado
WITH ProyectosFiltrados AS (
    SELECT 
        p.idProyecto,
        p.nombre,
        p.descripcion,
        p.estado,
        p.prioridad,
        p.progreso, -- Si existe columna calculada o estática
        p.fechaInicio,
        p.fechaFin,
        p.gerencia,
        p.subgerencia,
        p.area,
        p.tipo,
        p.idCreador,
        uc.nombre as CreadorNombre
    FROM p_Proyectos p
    LEFT JOIN p_Usuarios uc ON p.idCreador = uc.idUsuario
    WHERE 
        (@nombre      IS NULL OR p.nombre LIKE '%' + @nombre + '%') AND
        (@estado      IS NULL OR p.estado = @estado) AND
        (@gerencia    IS NULL OR p.gerencia = @gerencia) AND
        (@subgerencia IS NULL OR p.subgerencia = @subgerencia) AND
        (@area        IS NULL OR p.area = @area) AND
        (@tipo        IS NULL OR p.tipo = @tipo)
)
SELECT *
FROM ProyectosFiltrados
ORDER BY idProyecto DESC
OFFSET (@PageNumber - 1) * @PageSize ROWS
FETCH NEXT @PageSize ROWS ONLY;
