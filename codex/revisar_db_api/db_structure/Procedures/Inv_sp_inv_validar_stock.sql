CREATE   PROCEDURE Inv_sp_inv_validar_stock
    @almacenId INT,
    @productoId INT,
    @cantidadRequerida DECIMAL(18,2)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @actual DECIMAL(18,2);
    SELECT @actual = ISNULL(cantidad, 0) FROM Inv_inv_stock 
    WHERE almacenId = @almacenId AND productoId = @productoId AND propietarioTipo = 'EMPRESA';

    IF @actual < @cantidadRequerida
    BEGIN
        DECLARE @msg NVARCHAR(200) = 'Stock insuficiente en almacén. Disponible: ' + CAST(@actual AS NVARCHAR(20)) + ', Requerido: ' + CAST(@cantidadRequerida AS NVARCHAR(20));
        THROW 50001, @msg, 1;
    END

    SELECT 1 AS esValido;
END
GO