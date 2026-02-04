CREATE TABLE [dbo].[Inv_inv_conteos_detalle] (
    [idDetalle] int IDENTITY(1,1) NOT NULL,
    [idConteo] int NOT NULL,
    [productoId] int NOT NULL,
    [stockSistema] decimal(18,2) NULL,
    [stockFisico] decimal(18,2) NULL,
    [diferencia] decimal(19,2) NULL
);
GO
