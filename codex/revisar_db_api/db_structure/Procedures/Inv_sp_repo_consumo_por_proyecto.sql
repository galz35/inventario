CREATE   PROCEDURE Inv_sp_repo_consumo_por_proyecto
    @idProyecto INT = NULL,
    @fechaInicio DATETIME = NULL,
    @fechaFin DATETIME = NULL
AS
BEGIN
    SELECT 
        p.nombre AS proyecto,
        prod.nombre AS producto,
        prod.codigo,
        SUM(c.cantidad) AS totalConsumido,
        prod.unidad,
        COUNT(DISTINCT c.idOT) AS numOTsAfectadas
    FROM Inv_ope_ot_consumo c
    JOIN Inv_ope_ot ot ON c.idOT = ot.idOT
    JOIN Inv_ope_proyectos p ON ot.idProyecto = p.idProyecto
    JOIN Inv_cat_productos prod ON c.productoId = prod.idProducto
    WHERE (@idProyecto IS NULL OR p.idProyecto = @idProyecto)
      AND (@fechaInicio IS NULL OR c.fechaConsumo >= @fechaInicio)
      AND (@fechaFin IS NULL OR c.fechaConsumo <= @fechaFin)
    GROUP BY p.nombre, prod.nombre, prod.codigo, prod.unidad
    ORDER BY p.nombre, totalConsumido DESC
END
GO