-- =============================================
-- SCRIPT DE ACTUALIZACIÓN DE SCHEMA (INVCORE)
-- =============================================

-- 1. AGREGAR COLUMNAS FINANCIERAS
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Inv_cat_productos') AND name = 'costoPromedio')
BEGIN
    ALTER TABLE Inv_cat_productos ADD costoPromedio DECIMAL(18,2) DEFAULT 0;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Inv_cat_productos') AND name = 'minimo')
BEGIN
    ALTER TABLE Inv_cat_productos ADD minimo INT DEFAULT 5;
END

-- 2. ACTUALIZAR COSTOS DEMO
-- Modem Huawei: $45 USD
UPDATE Inv_cat_productos SET costoPromedio = 45.00, minimo = 10 WHERE codigo = 'ONT-HUA-01';
-- Cable UTP: $0.50 USD
UPDATE Inv_cat_productos SET costoPromedio = 0.50, minimo = 100 WHERE codigo = 'CABLE-UTP-CAT6';
-- Otros: Random
UPDATE Inv_cat_productos SET costoPromedio = 15.00 WHERE costoPromedio IS NULL OR costoPromedio = 0;

-- 3. RECREAR SP DASHBOARD (Ahora sí compilará)
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
    SELECT @Tecnicos = COUNT(*) FROM Inv_seg_usuarios WHERE activo = 1;

    -- RETORNAR
    SELECT 
        ISNULL(@ValorTotal, 0) as valorInventario,
        5.2 as valorInventarioDiff, 
        @SLA as cumplimientoSLA,
        -1.2 as slaDiff,
        @Alertas as alertasStock,
        @Tecnicos as tecnicosActivos;
END
GO

SELECT 'Schema Actualizado y Dashboard KPI Ready' as Mensaje;
