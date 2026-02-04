CREATE   PROCEDURE Inv_sp_cat_categoria_upsert
    @id INT = 0,
    @nombre NVARCHAR(100),
    @descripcion NVARCHAR(250) = NULL
AS
BEGIN
    IF @id = 0
        INSERT INTO Inv_cat_categorias_producto (nombre, descripcion) VALUES (@nombre, @descripcion);
    ELSE
        UPDATE Inv_cat_categorias_producto SET nombre = @nombre, descripcion = @descripcion WHERE idCategoria = @id;
END
GO