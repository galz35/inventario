-- Create SP for listing liquidations
CREATE   PROCEDURE Inv_sp_inv_liquidacion_listar
AS
BEGIN
    SELECT 
        l.idLiquidacion,
        l.proveedorId,
        p.nombre AS proveedorNombre,
        l.fechaLiquidacion AS fechaCorte,
        l.totalPagar,
        l.estado,
        l.notas
    FROM Inv_inv_liquidacion_consignacion l
    JOIN Inv_cat_proveedores p ON l.proveedorId = p.idProveedor
    ORDER BY l.fechaLiquidacion DESC;
END
GO