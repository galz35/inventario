CREATE   PROCEDURE Inv_sp_cat_almacen_upsert
    @id INT = 0,
    @nombre NVARCHAR(100),
    @idPadre INT = NULL,
    @tipo NVARCHAR(20),
    @responsableId INT = NULL,
    @ubicacion NVARCHAR(200) = NULL
AS
BEGIN
    IF @id = 0
        INSERT INTO Inv_cat_almacenes (nombre, idPadre, tipo, responsableId, ubicacion)
        VALUES (@nombre, @idPadre, @tipo, @responsableId, @ubicacion);
    ELSE
        UPDATE Inv_cat_almacenes SET 
            nombre = @nombre, idPadre = @idPadre, tipo = @tipo, 
            responsableId = @responsableId, ubicacion = @ubicacion
        WHERE idAlmacen = @id;
END
GO