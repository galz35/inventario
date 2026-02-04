CREATE TABLE [dbo].[Inv_sis_logs] (
    [idLog] int IDENTITY(1,1) NOT NULL,
    [idUsuario] int NULL,
    [accion] nvarchar(100) NULL,
    [entidad] nvarchar(100) NULL,
    [datos] nvarchar(max) NULL,
    [fecha] datetime NULL DEFAULT (getdate())
);
GO
