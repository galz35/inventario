CREATE TABLE [dbo].[Inv_act_movimientos] (
    [idMovimiento] int IDENTITY(1,1) NOT NULL,
    [idActivo] int NOT NULL,
    [tipoMovimiento] nvarchar(50) NULL,
    [idUsuarioResponsable] int NOT NULL,
    [almacenAnteriorId] int NULL,
    [almacenNuevoId] int NULL,
    [tecnicoAnteriorId] int NULL,
    [tecnicoNuevoId] int NULL,
    [fechaMovimiento] datetime NULL DEFAULT (getdate()),
    [notas] nvarchar(max) NULL
);
GO
