CREATE TABLE [dbo].[Inv_activos_trazabilidad] (
    [idTrazabilidad] uniqueidentifier NULL,
    [idRegistro] int IDENTITY(1,1) NOT NULL,
    [idActivo] int NOT NULL,
    [fechaEvento] datetime NULL DEFAULT (getdate()),
    [tipoEvento] nvarchar(50) NULL,
    [idUsuarioResponsable] int NULL,
    [detalle] nvarchar(max) NULL
);
GO
