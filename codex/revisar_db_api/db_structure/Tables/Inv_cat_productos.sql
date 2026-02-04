CREATE TABLE [dbo].[Inv_cat_productos] (
    [idProducto] int IDENTITY(1,1) NOT NULL,
    [codigo] nvarchar(50) NOT NULL,
    [nombre] nvarchar(200) NOT NULL,
    [idCategoria] int NULL,
    [unidad] nvarchar(20) NULL DEFAULT ('unidades'),
    [esSerializado] bit NULL DEFAULT ((0)),
    [costo] decimal(18,2) NULL DEFAULT ((0)),
    [minimoStock] int NULL DEFAULT ((0)),
    [activo] bit NULL DEFAULT ((1)),
    [fechaCreacion] datetime NULL DEFAULT (getdate()),
    [costoPromedio] decimal(18,2) NULL DEFAULT ((0)),
    [minimo] int NULL DEFAULT ((5))
);
GO
