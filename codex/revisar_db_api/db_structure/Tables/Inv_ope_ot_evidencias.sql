CREATE TABLE [dbo].[Inv_ope_ot_evidencias] (
    [idEvidencia] int IDENTITY(1,1) NOT NULL,
    [idOT] int NOT NULL,
    [tipoEvidencia] nvarchar(20) NULL,
    [urlArchivo] nvarchar(max) NULL,
    [fechaCarga] datetime NULL DEFAULT (getdate())
);
GO
