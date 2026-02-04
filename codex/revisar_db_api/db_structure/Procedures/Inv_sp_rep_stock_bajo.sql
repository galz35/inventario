CREATE   PROCEDURE Inv_sp_rep_stock_bajo
    @almacenId INT = NULL
AS
BEGIN
    SELECT 
        alm.nombre AS almacen,
        p.nombre AS producto,
        p.codigo,
        s.cantidad AS stockActual,
        p.minimoStock AS stockMinimo,
        (p.minimoStock - s.cantidad) AS faltante
    FROM Inv_inv_stock s
    JOIN Inv_cat_productos p ON s.productoId = p.idProducto
    JOIN Inv_cat_almacenes alm ON s.almacenId = alm.idAlmacen
    WHERE s.cantidad < p.minimoStock
      AND (@almacenId IS NULL OR s.almacenId = @almacenId)
    ORDER BY (p.minimoStock - s.cantidad) DESC;
END
GO