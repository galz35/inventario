CREATE   PROCEDURE Inv_sp_ot_consumo_registrar
    @idOT INT,
    @productoId INT,
    @cantidad DECIMAL(18,2),
    @idMovimientoInventario INT
AS
BEGIN
    INSERT INTO Inv_ope_ot_consumo (idOT, productoId, cantidad, idMovimientoInventario)
    VALUES (@idOT, @productoId, @cantidad, @idMovimientoInventario);
END
GO