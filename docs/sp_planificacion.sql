-- PROCEDIMIENTOS PARA PLANIFICACIÓN AVANZADA
USE inventario;
GO

-- 1. Crear Tarea WBS
CREATE OR ALTER PROCEDURE Inv_sp_proyecto_tarea_crear
    @idProyecto INT,
    @idTareaPadre INT = NULL,
    @nombre NVARCHAR(200),
    @descripcion NVARCHAR(MAX) = NULL,
    @fechaInicio DATETIME = NULL,
    @fechaFin DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Inv_ope_proyecto_tareas (idProyecto, idTareaPadre, nombre, descripcion, fechaInicioPrevista, fechaFinPrevista)
    VALUES (@idProyecto, @idTareaPadre, @nombre, @descripcion, @fechaInicio, @fechaFin);
    SELECT SCOPE_IDENTITY() AS idTarea;
END
GO

-- 2. Obtener WBS (Arbol)
CREATE OR ALTER PROCEDURE Inv_sp_proyecto_wbs_obtener
    @idProyecto INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM Inv_ope_proyecto_tareas 
    WHERE idProyecto = @idProyecto
    ORDER BY idTareaPadre ASC, orden ASC;
END
GO

-- 3. Estimar Materiales
CREATE OR ALTER PROCEDURE Inv_sp_proyecto_material_estimar
    @idTarea INT,
    @productoId INT,
    @cantidadEstimada DECIMAL(18,2),
    @idAlmacenSugerido INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM Inv_ope_proyecto_material_estimado WHERE idTarea = @idTarea AND productoId = @productoId)
    BEGIN
        UPDATE Inv_ope_proyecto_material_estimado 
        SET cantidadEstimada = @cantidadEstimada, idAlmacenSugerido = @idAlmacenSugerido
        WHERE idTarea = @idTarea AND productoId = @productoId;
    END
    ELSE
    BEGIN
        INSERT INTO Inv_ope_proyecto_material_estimado (idTarea, productoId, cantidadEstimada, idAlmacenSugerido)
        VALUES (@idTarea, @productoId, @cantidadEstimada, @idAlmacenSugerido);
    END
END
GO

-- 4. Reporte: Estimado vs Real (Basado en consumos de OT vinculadas a las tareas)
CREATE OR ALTER PROCEDURE Inv_sp_proyecto_presupuesto_vs_real
    @idProyecto INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        p.idProyecto,
        t.nombre AS Tarea,
        prod.nombre AS Material,
        est.cantidadEstimada,
        ISNULL(SUM(cons.cantidad), 0) AS cantidadRealConsumida,
        (est.cantidadEstimada - ISNULL(SUM(cons.cantidad), 0)) AS Diferencia
    FROM Inv_ope_proyectos p
    JOIN Inv_ope_proyecto_tareas t ON p.idProyecto = t.idProyecto
    JOIN Inv_ope_proyecto_material_estimado est ON t.idTarea = est.idTarea
    JOIN Inv_cat_productos prod ON est.productoId = prod.idProducto
    LEFT JOIN Inv_ope_ot ot ON t.idTarea = ot.idTareaWBS
    LEFT JOIN Inv_ope_ot_consumo cons ON ot.idOT = cons.idOT AND cons.productoId = est.productoId
    WHERE p.idProyecto = @idProyecto
    GROUP BY p.idProyecto, t.nombre, prod.nombre, est.cantidadEstimada;
END
GO

PRINT 'Procedimientos de planificación actualizados.';
GO
