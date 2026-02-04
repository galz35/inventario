CREATE TABLE [dbo].[Inv_cat_categorias_producto] (
    [idCategoria] int IDENTITY(1,1) NOT NULL,
    [nombre] nvarchar(100) NOT NULL,
    [descripcion] nvarchar(250) NULL,
    [activo] bit NULL DEFAULT ((1))
);
GO
