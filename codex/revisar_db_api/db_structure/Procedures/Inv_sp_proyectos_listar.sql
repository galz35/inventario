CREATE   PROCEDURE Inv_sp_proyectos_listar
    @buscar NVARCHAR(100) = NULL
AS
BEGIN
    SELECT * FROM Inv_ope_proyectos
    WHERE (@buscar IS NULL OR nombre LIKE '%' + @buscar + '%' OR descripcion LIKE '%' + @buscar + '%')
    ORDER BY fechaCreacion DESC
END
GO