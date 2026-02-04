
-- =============================================================
-- FIX: Activos SPs (Missing)
-- =============================================================

CREATE   PROCEDURE Inv_sp_activo_historial_obtener
    @idActivo INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Si la tabla existe, devolver datos reales
    IF OBJECT_ID('dbo.Inv_activos_trazabilidad', 'U') IS NOT NULL
    BEGIN
        SELECT 
            t.idRegistro as id,
            t.tipoEvento as accion,
            t.fechaEvento as fecha,
            u.nombre as usuario,
            t.detalle as notas
        FROM Inv_activos_trazabilidad t
        LEFT JOIN Inv_seg_usuarios u ON t.idUsuarioResponsable = u.idUsuario
        WHERE t.idActivo = @idActivo
        ORDER BY t.fechaEvento DESC;
    END
    ELSE
    BEGIN
        -- Retornar dataset vacío si no existe tabla aún (paranoia mode)
        SELECT 1 WHERE 1=0; 
    END
END

GO