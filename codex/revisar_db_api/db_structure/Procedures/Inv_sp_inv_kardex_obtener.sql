CREATE   PROCEDURE Inv_sp_inv_kardex_obtener
    @productoId INT,
    @almacenId INT = NULL,
    @fechaInicio DATETIME = NULL,
    @fechaFin DATETIME = NULL
AS
BEGIN
    SELECT 
        m.fechaMovimiento,
        m.tipoMovimiento,
        almO.nombre AS origen,
        almD.nombre AS destino,
        d.cantidad,
        m.referenciaTexto,
        u.nombre AS responsable
    FROM Inv_inv_movimiento_detalle d
    JOIN Inv_inv_movimientos m ON d.idMovimiento = m.idMovimiento
    LEFT JOIN Inv_cat_almacenes almO ON m.almacenOrigenId = almO.idAlmacen
    LEFT JOIN Inv_cat_almacenes almD ON m.almacenDestinoId = almD.idAlmacen
    JOIN Inv_seg_usuarios u ON m.idUsuarioResponsable = u.idUsuario
    WHERE d.productoId = @productoId
      AND (@almacenId IS NULL OR m.almacenOrigenId = @almacenId OR m.almacenDestinoId = @almacenId)
      AND (@fechaInicio IS NULL OR m.fechaMovimiento >= @fechaInicio)
      AND (@fechaFin IS NULL OR m.fechaMovimiento <= @fechaFin)
    ORDER BY m.fechaMovimiento DESC;
END
GO