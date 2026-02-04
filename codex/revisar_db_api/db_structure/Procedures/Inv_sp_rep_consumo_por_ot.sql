CREATE   PROCEDURE Inv_sp_rep_consumo_por_ot
    @idOT INT
AS
BEGIN
    SELECT 
        ot.idOT,
        p.idProyecto,
        p.nombre AS proyectoNombre,
        prod.codigo,
        prod.nombre AS productoNombre,
        c.cantidad,
        prod.unidad,
        c.fechaConsumo
    FROM Inv_ope_ot_consumo c
    JOIN Inv_ope_ot ot ON c.idOT = ot.idOT
    JOIN Inv_cat_productos prod ON c.productoId = prod.idProducto
    LEFT JOIN Inv_ope_proyectos p ON ot.idProyecto = p.idProyecto
    WHERE ot.idOT = @idOT;
END
GO