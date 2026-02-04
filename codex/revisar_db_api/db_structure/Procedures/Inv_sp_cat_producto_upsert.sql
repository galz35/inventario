CREATE   PROCEDURE Inv_sp_cat_producto_upsert
    @id INT = 0,
    @codigo NVARCHAR(50),
    @nombre NVARCHAR(200),
    @idCategoria INT,
    @unidad NVARCHAR(20),
    @esSerializado BIT,
    @costo DECIMAL(18,2),
    @minimoStock INT
AS
BEGIN
    IF @id = 0
        INSERT INTO Inv_cat_productos (codigo, nombre, idCategoria, unidad, esSerializado, costo, minimoStock)
        VALUES (@codigo, @nombre, @idCategoria, @unidad, @esSerializado, @costo, @minimoStock);
    ELSE
        UPDATE Inv_cat_productos SET 
            codigo = @codigo, nombre = @nombre, idCategoria = @idCategoria, 
            unidad = @unidad, esSerializado = @esSerializado, costo = @costo, minimoStock = @minimoStock
        WHERE idProducto = @id;
END
GO