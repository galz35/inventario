CREATE TABLE [dbo].[Inv_activos] (
    [idActivo] int IDENTITY(1,1) NOT NULL,
    [serial] nvarchar(100) NOT NULL,
    [idProducto] int NOT NULL,
    [estado] nvarchar(50) NULL DEFAULT ('ALMACEN'),
    [idAlmacenActual] int NULL,
    [idTecnicoActual] int NULL,
    [fechaCreacion] datetime NULL DEFAULT (getdate()),
    [fechaActualizacion] datetime NULL DEFAULT (getdate())
);
GO
