CREATE TABLE [dbo].[Inv_inv_ajustes] (
    [idAjuste] int IDENTITY(1,1) NOT NULL,
    [almacenId] int NOT NULL,
    [productoId] int NOT NULL,
    [cantidadAnterior] decimal(18,2) NULL,
    [cantidadNueva] decimal(18,2) NULL,
    [motivo] nvarchar(max) NULL,
    [idUsuario] int NOT NULL,
    [fechaAjuste] datetime NULL DEFAULT (getdate())
);
GO
