CREATE TABLE [dbo].[Inv_cat_almacenes] (
    [idAlmacen] int IDENTITY(1,1) NOT NULL,
    [nombre] nvarchar(100) NOT NULL,
    [idPadre] int NULL,
    [tipo] nvarchar(20) NOT NULL,
    [responsableId] int NULL,
    [ubicacion] nvarchar(200) NULL,
    [activo] bit NULL DEFAULT ((1)),
    [fechaCreacion] datetime NULL DEFAULT (getdate())
);
GO
