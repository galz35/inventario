CREATE TABLE [dbo].[Inv_inv_conteos_cabecera] (
    [idConteo] int IDENTITY(1,1) NOT NULL,
    [almacenId] int NOT NULL,
    [idUsuarioInicia] int NOT NULL,
    [fechaInicio] datetime NULL DEFAULT (getdate()),
    [fechaFin] datetime NULL,
    [estado] nvarchar(20) NULL DEFAULT ('ABIERTO'),
    [notas] nvarchar(max) NULL
);
GO
