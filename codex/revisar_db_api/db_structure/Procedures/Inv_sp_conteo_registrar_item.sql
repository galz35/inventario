CREATE   PROCEDURE Inv_sp_conteo_registrar_item
    @idConteo INT,
    @productoId INT,
    @stockFisico DECIMAL(18,2)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @almacenId INT, @stockSistema DECIMAL(18,2);
    SELECT @almacenId = almacenId FROM Inv_inv_conteos_cabecera WHERE idConteo = @idConteo;
    
    -- Obtener stock actual del sistema
    SELECT @stockSistema = ISNULL(cantidad, 0) FROM Inv_inv_stock WHERE almacenId = @almacenId AND productoId = @productoId;

    IF EXISTS (SELECT 1 FROM Inv_inv_conteos_detalle WHERE idConteo = @idConteo AND productoId = @productoId)
        UPDATE Inv_inv_conteos_detalle SET stockFisico = @stockFisico, stockSistema = @stockSistema WHERE idConteo = @idConteo AND productoId = @productoId;
    ELSE
        INSERT INTO Inv_inv_conteos_detalle (idConteo, productoId, stockSistema, stockFisico)
        VALUES (@idConteo, @productoId, @stockSistema, @stockFisico);
END
GO