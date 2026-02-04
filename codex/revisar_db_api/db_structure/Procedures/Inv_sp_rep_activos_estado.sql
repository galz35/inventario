CREATE   PROCEDURE Inv_sp_rep_activos_estado
AS
BEGIN
    SELECT 
        estado,
        COUNT(*) AS total,
        SUM(p.costo) AS valorEstimado
    FROM Inv_act_activos a
    JOIN Inv_cat_productos p ON a.idProducto = p.idProducto
    GROUP BY estado;
END
GO