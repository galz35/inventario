CREATE TABLE [dbo].[Inv_inv_liquidacion_consignacion_det] (
    [idDetalle] int IDENTITY(1,1) NOT NULL,
    [idLiquidacion] int NOT NULL,
    [productoId] int NOT NULL,
    [cantidadLiquidada] decimal(18,2) NOT NULL,
    [precioUnitario] decimal(18,2) NOT NULL,
    [subtotal] decimal(37,4) NULL
);
GO
