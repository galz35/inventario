CREATE TABLE [dbo].[Inv_act_reparaciones] (
    [idReparacion] int IDENTITY(1,1) NOT NULL,
    [idActivo] int NOT NULL,
    [fechaEnvio] datetime NULL DEFAULT (getdate()),
    [fechaRetorno] datetime NULL,
    [diagnostico] nvarchar(max) NULL,
    [resultado] nvarchar(50) NULL,
    [costoReparacion] decimal(18,2) NULL DEFAULT ((0)),
    [enviadoPor] int NULL
);
GO
