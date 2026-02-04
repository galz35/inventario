CREATE   PROCEDURE Inv_sp_proyecto_resumen
    @idProyecto INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @totalOT INT, @cerradasOT INT, @avance DECIMAL(5,2);
    
    SELECT @totalOT = COUNT(*) FROM Inv_ope_ot WHERE idProyecto = @idProyecto;
    SELECT @cerradasOT = COUNT(*) FROM Inv_ope_ot WHERE idProyecto = @idProyecto AND estado = 'FINALIZADA';
    
    SET @avance = CASE WHEN @totalOT = 0 THEN 0 ELSE (CAST(@cerradasOT AS DECIMAL) / @totalOT) * 100 END;

    SELECT 
        p.idProyecto,
        p.nombre,
        p.estado,
        @avance AS porcentajeAvance,
        ISNULL(SUM(c.cantidad * prod.costo), 0) AS costoMaterialesTotal,
        @totalOT AS totalOT,
        @cerradasOT AS cerradasOT
    FROM Inv_ope_proyectos p
    LEFT JOIN Inv_ope_ot ot ON p.idProyecto = ot.idProyecto
    LEFT JOIN Inv_ope_ot_consumo c ON ot.idOT = c.idOT
    LEFT JOIN Inv_cat_productos prod ON c.productoId = prod.idProducto
    WHERE p.idProyecto = @idProyecto
    GROUP BY p.idProyecto, p.nombre, p.estado;
END
GO