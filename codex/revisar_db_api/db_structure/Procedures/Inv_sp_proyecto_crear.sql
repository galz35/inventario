CREATE   PROCEDURE Inv_sp_proyecto_crear
    @nombre NVARCHAR(150),
    @descripcion NVARCHAR(MAX),
    @idResponsable INT,
    @fechaInicio DATETIME = NULL,
    @fechaFin DATETIME = NULL
AS
BEGIN
    INSERT INTO Inv_ope_proyectos (nombre, descripcion, idResponsable, fechaInicio, fechaFin, estado)
    VALUES (@nombre, @descripcion, @idResponsable, @fechaInicio, @fechaFin, 'PLANIFICADO');
    
    SELECT SCOPE_IDENTITY() AS idProyecto;
END
GO