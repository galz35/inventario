CREATE TABLE [dbo].[Inv_cat_tipos_ot] (
    [idTipoOT] int IDENTITY(1,1) NOT NULL,
    [nombre] nvarchar(50) NOT NULL,
    [requiereFirma] bit NULL DEFAULT ((1)),
    [requiereEvidencia] bit NULL DEFAULT ((1)),
    [requiereEquipoSerializado] bit NULL DEFAULT ((0)),
    [slaHoras] int NULL DEFAULT ((24)),
    [activo] bit NULL DEFAULT ((1))
);
GO
