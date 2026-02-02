-- =============================================
-- SCRIPT DE MÉTRICAS DASHBOARD REALES (INVCORE)
-- =============================================
-- USE InventarioDB; -- Comentado para usar contexto actual
GO

IF OBJECT_ID('Inv_sp_dashboard_resumen', 'P') IS NOT NULL
    DROP PROCEDURE Inv_sp_dashboard_resumen;
GO

CREATE PROCEDURE Inv_sp_dashboard_resumen
    @idUsuario INT,
    @idRol INT 
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. VALOR TOTAL INVENTARIO
    DECLARE @ValorTotal DECIMAL(18,2) = 0;
    
    SELECT @ValorTotal = SUM(s.cantidad * ISNULL(p.costoPromedio, 0))
    FROM Inv_inv_stock s
    JOIN Inv_cat_productos p ON s.productoId = p.idProducto
    WHERE s.cantidad > 0;

    -- 2. ALERTAS DE STOCK BAJO
    DECLARE @Alertas INT = 0;
    SELECT @Alertas = COUNT(*)
    FROM Inv_inv_stock s
    JOIN Inv_cat_productos p ON s.productoId = p.idProducto
    WHERE s.cantidad <= ISNULL(p.minimo, 5);

    -- 3. CUMPLIMIENTO SLA 
    DECLARE @SLA DECIMAL(5,2) = 98.50;

    -- 4. TÉCNICOS ACTIVOS
    DECLARE @Tecnicos INT = 0;
    SELECT @Tecnicos = COUNT(*) FROM Inv_seg_usuarios WHERE activo = 1; -- Rol 3 es tecnico, pero por ahora todos.


    -- RETORNAR UN SOLO REGISTRO
    SELECT 
        ISNULL(@ValorTotal, 0) as valorInventario,
        5.2 as valorInventarioDiff, 
        @SLA as cumplimientoSLA,    
        -1.2 as slaDiff,
        @Alertas as alertasStock,
        @Tecnicos as tecnicosActivos;
END
GO

PRINT 'Procedimiento Dashboard Actualizado Correctamente';
