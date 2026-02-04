CREATE   PROCEDURE Inv_sp_activo_historial
    @idActivo INT
AS
BEGIN
    SELECT 
        m.fechaMovimiento,
        m.tipoMovimiento,
        u.nombre AS responsable,
        ao.nombre AS almacenAnterior,
        an.nombre AS almacenNuevo,
        m.notas
    FROM Inv_act_movimientos m
    JOIN Inv_seg_usuarios u ON m.idUsuarioResponsable = u.idUsuario
    LEFT JOIN Inv_cat_almacenes ao ON m.almacenAnteriorId = ao.idAlmacen
    LEFT JOIN Inv_cat_almacenes an ON m.almacenNuevoId = an.idAlmacen
    WHERE m.idActivo = @idActivo
    ORDER BY m.fechaMovimiento DESC;
END
GO