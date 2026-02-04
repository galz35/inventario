CREATE TABLE [dbo].[Inv_inv_movimiento_detalle] (
    [idDetalle] int IDENTITY(1,1) NOT NULL,
    [idMovimiento] int NOT NULL,
    [productoId] int NOT NULL,
    [propietarioTipo] nvarchar(20) NULL DEFAULT ('EMPRESA'),
    [proveedorId] int NOT NULL DEFAULT ((0)),
    [cantidad] decimal(18,2) NOT NULL,
    [costoUnitario] decimal(18,2) NULL DEFAULT ((0)),
    [stockAnterior] decimal(18,2) NULL DEFAULT ((0)),
    [stockNuevo] decimal(18,2) NULL DEFAULT ((0))
);
GO
