CREATE   PROCEDURE Inv_sp_cat_proveedor_upsert
    @id INT = 0,
    @nombre NVARCHAR(150),
    @nit NVARCHAR(50) = NULL,
    @contacto NVARCHAR(100) = NULL,
    @telefono NVARCHAR(50) = NULL,
    @correo NVARCHAR(100) = NULL
AS
BEGIN
    IF @id = 0
        INSERT INTO Inv_cat_proveedores (nombre, nit, contacto, telefono, correo) VALUES (@nombre, @nit, @contacto, @telefono, @correo);
    ELSE
        UPDATE Inv_cat_proveedores SET nombre = @nombre, nit = @nit, contacto = @contacto, telefono = @telefono, correo = @correo WHERE idProveedor = @id;
END
GO