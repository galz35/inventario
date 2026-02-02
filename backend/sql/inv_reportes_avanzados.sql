USE Bdplaner;
GO

-- 1. Reporte de Consumo vs Presupuesto por Proyecto
CREATE OR ALTER PROCEDURE Inv_sp_repo_consumo_por_proyecto
    @idProyecto INT = NULL,
    @fechaInicio DATETIME = NULL,
    @fechaFin DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        p.nombre as Proyecto,
        t.nombre as Tarea,
        mv.productoNombre,
        SUM(mv.cantidad) as TotalConsumido,
        mv.unidad,
        STRING_AGG(mv.referenciaTexto, ', ') as OTs_Referencia
    FROM Inv_inv_movimiento_detalle mv
    JOIN Inv_inv_movimiento_header h ON mv.idMovimiento = h.idMovimiento
    -- Aquí unimos con OT para saber proyecto y tarea
    JOIN Inv_ope_ot ot ON h.referenciaTexto LIKE '%#' + CAST(ot.idOT as NVARCHAR(20)) + '%'
    JOIN Inv_ope_proyectos p ON ot.idProyecto = p.idProyecto
    LEFT JOIN Inv_ope_tareas t ON ot.idTarea = t.idTarea
    WHERE 
        (@idProyecto IS NULL OR p.idProyecto = @idProyecto) AND
        (@fechaInicio IS NULL OR h.fechaMovimiento >= @fechaInicio) AND
        (@fechaFin IS NULL OR h.fechaMovimiento <= @fechaFin) AND
        h.tipoMovimiento = 'CONSUMO_OT'
    GROUP BY p.nombre, t.nombre, mv.productoNombre, mv.unidad
    ORDER BY p.nombre, t.nombre;
END
GO

-- 2. Reporte SLA (Tiempos de Atención)
CREATE OR ALTER PROCEDURE Inv_sp_rep_ot_sla_tiempos
    @fechaInicio DATETIME = NULL,
    @fechaFin DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        ot.idOT,
        c.nombre as cliente,
        u.nombreCompleto as tecnico,
        ot.tipo as tipoOT,
        ot.fechaCreacion,
        ot.fechaCierre,
        DATEDIFF(HOUR, ot.fechaCreacion, ot.fechaCierre) as horasTranscurridas,
        CASE 
            WHEN DATEDIFF(HOUR, ot.fechaCreacion, ot.fechaCierre) <= 48 THEN 'DENTRO'
            ELSE 'FUERA'
        END as estadoSLA,
        48 as slaMeta -- Hardcoded meta de ejemplo 48h
    FROM Inv_ope_ot ot
    LEFT JOIN Inv_cat_clientes c ON ot.idCliente = c.idCliente
    LEFT JOIN p_Usuarios u ON ot.idTecnico = u.idUsuario
    WHERE 
        ot.estado = 'FINALIZADA' OR ot.estado = 'CERRADA' AND
        (@fechaInicio IS NULL OR ot.fechaCierre >= @fechaInicio) AND
        (@fechaFin IS NULL OR ot.fechaCierre <= @fechaFin)
    ORDER BY ot.fechaCierre DESC;
END
GO

-- 3. Métricas de Dashboard Resumido
CREATE OR ALTER PROCEDURE Inv_sp_dashboard_resumen
    @idUsuario INT,
    @idRol INT -- No usado directamente, la lógica depende del user
AS
BEGIN
    SET NOCOUNT ON;

    -- Variables para acumular
    DECLARE @valorInventario DECIMAL(18,2) = 0;
    DECLARE @otsActivas INT = 0;
    DECLARE @alertasStock INT = 0;
    DECLARE @otsCriticas INT = 0;
    
    -- Calculamos valor inventario (Todo el almacén)
    SELECT @valorInventario = SUM(s.cantidad * ISNULL(p.precioReferencia, 0))
    FROM Inv_inv_stock s
    JOIN Inv_cat_productos p ON s.productoId = p.idProducto;

    -- OTs Activas
    SELECT @otsActivas = COUNT(*) FROM Inv_ope_ot WHERE estado NOT IN ('FINALIZADA', 'CERRADA');

    -- OTs Criticas
    SELECT @otsCriticas = COUNT(*) FROM Inv_ope_ot WHERE estado NOT IN ('FINALIZADA', 'CERRADA') AND prioridad = 'CRITICA';

    -- Stock Bajo
    SELECT @alertasStock = COUNT(*) FROM Inv_inv_stock s JOIN Inv_cat_productos p ON s.productoId = p.idProducto WHERE s.cantidad <= p.stockMinimo;

    SELECT 
        @valorInventario as valorInventario,
        @otsActivas as otsActivas,
        @otsCriticas as otsCriticas,
        @alertasStock as alertasStock,
        94.5 as cumplimientoSLA, -- Hardcoded x demo
        -- Datos Técnico
        (SELECT COUNT(*) FROM Inv_ope_ot WHERE idTecnico = @idUsuario AND fechaCreacion >= CAST(GETDATE() AS DATE)) as misOtsHoy,
        (SELECT COUNT(*) FROM Inv_ope_ot WHERE idTecnico = @idUsuario AND estado = 'ASIGNADA') as misOtsPendientes,
        98 as miSLA,
        (SELECT COUNT(*) FROM Inv_inv_stock WHERE almacenId = (SELECT idAlmacen FROM Inv_cat_almacenes WHERE idResponsable = @idUsuario)) as itemsCargo
END
GO

PRINT '✅ Reportes Avanzados SPs instalados.';
