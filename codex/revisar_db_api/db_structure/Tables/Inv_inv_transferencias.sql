CREATE TABLE [dbo].[Inv_inv_transferencias] (
    [idTransferencia] int IDENTITY(1,1) NOT NULL,
    [almacenOrigenId] int NOT NULL,
    [almacenDestinoId] int NOT NULL,
    [idUsuarioEnvia] int NOT NULL,
    [idUsuarioRecibe] int NULL,
    [fechaEnvio] datetime NULL DEFAULT (getdate()),
    [fechaRecepcion] datetime NULL,
    [estado] nvarchar(20) NULL DEFAULT ('EN_TRANSITO'),
    [notas] nvarchar(max) NULL
);
GO
