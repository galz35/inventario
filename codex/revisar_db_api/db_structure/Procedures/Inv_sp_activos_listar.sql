CREATE   PROCEDURE Inv_sp_activos_listar
    @estado NVARCHAR(50) = NULL,
    @idAlmacen INT = NULL,
    @idTecnico INT = NULL,
    @buscar NVARCHAR(100) = NULL
AS
BEGIN
    SELECT 
        a.*,
        p.nombre AS productoNombre,
        p.codigo AS productoCodigo
    FROM Inv_act_activos a
    JOIN Inv_cat_productos p ON a.idProducto = p.idProducto
    WHERE (@estado IS NULL OR a.estado = @estado)
      AND (@idAlmacen IS NULL OR a.idAlmacenActual = @idAlmacen)
      AND (@idTecnico IS NULL OR a.idTecnicoActual = @idTecnico)
      AND (@buscar IS NULL OR a.serial LIKE '%' + @buscar + '%' OR p.nombre LIKE '%' + @buscar + '%');
END
GO