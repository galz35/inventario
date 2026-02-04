CREATE TABLE [dbo].[Inv_ope_ot_firmas] (
    [idOT] int NOT NULL,
    [nombreFirmante] nvarchar(100) NULL,
    [dniFirmante] nvarchar(20) NULL,
    [urlFirma] nvarchar(max) NULL,
    [fechaFirma] datetime NULL DEFAULT (getdate())
);
GO
