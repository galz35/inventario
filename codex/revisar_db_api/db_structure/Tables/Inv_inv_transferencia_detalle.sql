CREATE TABLE [dbo].[Inv_inv_transferencia_detalle] (
    [idDetalle] int IDENTITY(1,1) NOT NULL,
    [idTransferencia] int NOT NULL,
    [productoId] int NOT NULL,
    [cantidadEnviada] decimal(18,2) NOT NULL,
    [cantidadRecibida] decimal(18,2) NULL
);
GO
