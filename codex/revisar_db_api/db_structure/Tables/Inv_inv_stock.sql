CREATE TABLE [dbo].[Inv_inv_stock] (
    [almacenId] int NOT NULL,
    [productoId] int NOT NULL,
    [propietarioTipo] nvarchar(20) NOT NULL DEFAULT ('EMPRESA'),
    [proveedorId] int NOT NULL DEFAULT ((0)),
    [cantidad] decimal(18,2) NOT NULL DEFAULT ((0))
);
GO
