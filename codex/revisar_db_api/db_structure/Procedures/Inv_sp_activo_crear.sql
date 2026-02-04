
CREATE   PROCEDURE Inv_sp_activo_crear
    @serial NVARCHAR(100),
    @idProducto INT,
    @idAlmacen INT = NULL,
    @estado NVARCHAR(50) = 'ALMACEN'
AS
BEGIN
    INSERT INTO Inv_activos (serial, idProducto, idAlmacenActual, estado)
    VALUES (@serial, @idProducto, @idAlmacen, @estado);
    
    DECLARE @newId INT = SCOPE_IDENTITY();
    
    -- Log inicial
    INSERT INTO Inv_activos_trazabilidad (idActivo, tipoEvento, detalle)
    VALUES (@newId, 'CREACION', 'Alta inicial del activo');
    
    SELECT @newId as idActivo;
END

GO