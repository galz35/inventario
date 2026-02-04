CREATE TABLE [dbo].[Inv_ope_ot_consumo] (
    [idConsumo] int IDENTITY(1,1) NOT NULL,
    [idOT] int NOT NULL,
    [productoId] int NOT NULL,
    [cantidad] decimal(18,2) NOT NULL,
    [idMovimientoInventario] int NULL,
    [fechaConsumo] datetime NULL DEFAULT (getdate())
);
GO
