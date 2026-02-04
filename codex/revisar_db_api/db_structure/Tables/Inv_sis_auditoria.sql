CREATE TABLE [dbo].[Inv_sis_auditoria] (
    [idAuditoria] int IDENTITY(1,1) NOT NULL,
    [idUsuario] int NULL,
    [accion] nvarchar(100) NULL,
    [entidad] nvarchar(100) NULL,
    [entidadId] nvarchar(50) NULL,
    [datosAnteriores] nvarchar(max) NULL,
    [datosNuevos] nvarchar(max) NULL,
    [fecha] datetime NULL DEFAULT (getdate())
);
GO
