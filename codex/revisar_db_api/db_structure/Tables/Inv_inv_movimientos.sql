CREATE TABLE [dbo].[Inv_inv_movimientos] (
    [idMovimiento] int IDENTITY(1,1) NOT NULL,
    [tipoMovimiento] nvarchar(50) NOT NULL,
    [almacenOrigenId] int NULL,
    [almacenDestinoId] int NULL,
    [idDocumentoReferencia] int NULL,
    [tipoDocumentoReferencia] nvarchar(50) NULL,
    [referenciaTexto] nvarchar(100) NULL,
    [notas] nvarchar(max) NULL,
    [fechaMovimiento] datetime NULL DEFAULT (getdate()),
    [idUsuarioResponsable] int NOT NULL,
    [estado] nvarchar(20) NULL DEFAULT ('APLICADO')
);
GO
