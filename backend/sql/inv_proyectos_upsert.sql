USE Bdplaner;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Inv_ope_proyectos')
BEGIN
    CREATE TABLE Inv_ope_proyectos (
        idProyecto INT IDENTITY(1,1) PRIMARY KEY,
        nombre NVARCHAR(255) NOT NULL,
        descripcion NVARCHAR(MAX) NULL,
        idResponsable INT NULL,
        idAlmacenProyecto INT NULL,
        fechaInicio DATETIME NULL,
        fechaFin DATETIME NULL,
        estado NVARCHAR(50) DEFAULT 'ACTIVO',
        fechaCreacion DATETIME DEFAULT GETDATE(),
        fechaActualizacion DATETIME DEFAULT GETDATE()
    );
END
GO

CREATE OR ALTER PROCEDURE Inv_sp_proyectos_listar
    @buscar NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        p.*,
        u.nombreCompleto as responsableNombre,
        a.nombre as almacenNombre
    FROM Inv_ope_proyectos p
    LEFT JOIN p_Usuarios u ON p.idResponsable = u.idUsuario
    LEFT JOIN Inv_cat_almacenes a ON p.idAlmacenProyecto = a.idAlmacen
    WHERE (@buscar IS NULL OR p.nombre LIKE '%' + @buscar + '%' OR p.descripcion LIKE '%' + @buscar + '%')
    ORDER BY p.fechaCreacion DESC;
END
GO

CREATE OR ALTER PROCEDURE Inv_sp_proyectos_upsert
    @idProyecto INT = NULL,
    @nombre NVARCHAR(255),
    @descripcion NVARCHAR(MAX) = NULL,
    @idResponsable INT = NULL,
    @idAlmacenProyecto INT = NULL,
    @fechaInicio DATETIME = NULL,
    @fechaFin DATETIME = NULL,
    @estado NVARCHAR(50) = 'ACTIVO'
AS
BEGIN
    SET NOCOUNT ON;
    IF @idProyecto IS NULL OR @idProyecto = 0
    BEGIN
        INSERT INTO Inv_ope_proyectos (nombre, descripcion, idResponsable, idAlmacenProyecto, fechaInicio, fechaFin, estado, fechaCreacion, fechaActualizacion)
        VALUES (@nombre, @descripcion, @idResponsable, @idAlmacenProyecto, @fechaInicio, @fechaFin, @estado, GETDATE(), GETDATE());
        SELECT SCOPE_IDENTITY() AS idProyecto;
    END
    ELSE
    BEGIN
        UPDATE Inv_ope_proyectos
        SET nombre = @nombre,
            descripcion = @descripcion,
            idResponsable = @idResponsable,
            idAlmacenProyecto = @idAlmacenProyecto,
            fechaInicio = @fechaInicio,
            fechaFin = @fechaFin,
            estado = @estado,
            fechaActualizacion = GETDATE()
        WHERE idProyecto = @idProyecto;
        SELECT @idProyecto AS idProyecto;
    END
END
GO

PRINT '✅ Procedimientos de Proyectos (Inv_sp_proyectos_*) creados correctamente.';
