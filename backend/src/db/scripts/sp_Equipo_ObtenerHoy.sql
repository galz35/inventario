
-- =============================================
-- Author:      InventarioCore System
-- Create date: 2026-01-25
-- Description: Obtiene el resumen de tareas de hoy para una lista de carnets
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_Equipo_ObtenerHoy]
    @carnetsList NVARCHAR(MAX), -- Lista de carnets separados por coma '500708,123456'
    @fecha DATE
AS
BEGIN
    SET NOCOUNT ON;

    -- CTE para limpiar y convertir la lista en tabla
    -- Requiere compatibilidad SQL Server 2016+ (STRING_SPLIT)
    -- Si es anterior, usar función split custom, pero asumimos moderno.

    SELECT 
        u.idUsuario, 
        SUM(CASE 
            WHEN t.estado IN ('Pendiente', 'EnCurso', 'Pausa', 'Bloqueada', 'Revision') 
                 AND CAST(t.fechaObjetivo AS DATE) < @fecha 
            THEN 1 ELSE 0 
        END) as retrasadas,
        
        SUM(CASE 
            WHEN t.estado IN ('Pendiente', 'EnCurso', 'Pausa', 'Bloqueada', 'Revision') 
                 AND CAST(t.fechaObjetivo AS DATE) = @fecha 
            THEN 1 ELSE 0 
        END) as hoy,
        
        SUM(CASE 
            WHEN t.estado = 'Hecha' 
                 AND CAST(t.fechaCompletado AS DATE) = @fecha 
            THEN 1 ELSE 0 
        END) as hechas

    FROM Inv_ope_proyecto_tareas t
    INNER JOIN Inv_ope_proyecto_tarea_asignados ta ON t.idTarea = ta.idTarea
    INNER JOIN Inv_seg_usuarios u ON ta.idUsuario = u.idUsuario
    INNER JOIN STRING_SPLIT(@carnetsList, ',') as L ON u.carnet = L.value -- Filtrado eficiente por JOIN
    
    WHERE t.activo = 1
    GROUP BY u.idUsuario;
END
GO


