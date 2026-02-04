CREATE TABLE [dbo].[Inv_inv_liquidacion_consignacion] (
    [idLiquidacion] int IDENTITY(1,1) NOT NULL,
    [proveedorId] int NOT NULL,
    [idUsuarioResponsable] int NOT NULL,
    [fechaLiquidacion] datetime NULL DEFAULT (getdate()),
    [totalPagar] decimal(18,2) NULL DEFAULT ((0)),
    [estado] nvarchar(20) NULL DEFAULT ('PENDIENTE'),
    [notas] nvarchar(max) NULL
);
GO
