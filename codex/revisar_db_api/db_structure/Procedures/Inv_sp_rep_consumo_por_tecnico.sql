CREATE   PROCEDURE Inv_sp_rep_consumo_por_tecnico
    @fechaInicio DATETIME = NULL,
    @fechaFin DATETIME = NULL
AS
BEGIN
    SELECT 
        u.nombre AS tecnico,
        p.nombre AS producto,
        p.codigo,
        SUM(d.cantidad) AS totalConsumido,
        p.unidad,
        SUM(d.cantidad * p.costo) AS costoTotal
    FROM Inv_inv_movimiento_detalle d
    JOIN Inv_inv_movimientos m ON d.idMovimiento = m.idMovimiento
    JOIN Inv_cat_productos p ON d.productoId = p.idProducto
    JOIN Inv_seg_usuarios u ON m.idUsuarioResponsable = u.idUsuario
    WHERE m.tipoMovimiento = 'CONSUMO_OT'
      AND (@fechaInicio IS NULL OR m.fechaMovimiento >= @fechaInicio)
      AND (@fechaFin IS NULL OR m.fechaMovimiento <= @fechaFin)
    GROUP BY u.nombre, p.nombre, p.codigo, p.unidad
    ORDER BY u.nombre, totalConsumido DESC;
END
GO