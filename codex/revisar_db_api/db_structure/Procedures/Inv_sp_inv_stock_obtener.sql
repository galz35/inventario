CREATE   PROCEDURE Inv_sp_inv_stock_obtener
    @almacenId INT = NULL,
    @productoId INT = NULL,
    @buscar NVARCHAR(100) = NULL
AS
BEGIN
    SELECT 
        s.almacenId,
        alm.nombre AS almacenNombre,
        s.productoId,
        p.nombre AS productoNombre,
        p.codigo AS productoCodigo,
        s.propietarioTipo,
        s.proveedorId,
        prov.nombre AS proveedorNombre,
        s.cantidad,
        p.unidad
    FROM Inv_inv_stock s
    JOIN Inv_cat_productos p ON s.productoId = p.idProducto
    JOIN Inv_cat_almacenes alm ON s.almacenId = alm.idAlmacen
    LEFT JOIN Inv_cat_proveedores prov ON s.proveedorId = prov.idProveedor
    WHERE (@almacenId IS NULL OR s.almacenId = @almacenId)
      AND (@productoId IS NULL OR s.productoId = @productoId)
      AND (@buscar IS NULL OR p.nombre LIKE '%' + @buscar + '%' OR p.codigo LIKE '%' + @buscar + '%')
    ORDER BY p.nombre;
END
GO