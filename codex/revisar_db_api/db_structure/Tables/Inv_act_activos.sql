CREATE TABLE [dbo].[Inv_act_activos] (
    [idActivo] int IDENTITY(1,1) NOT NULL,
    [serial] nvarchar(50) NOT NULL,
    [idProducto] int NOT NULL,
    [estado] nvarchar(20) NULL DEFAULT ('DISPONIBLE'),
    [idAlmacenActual] int NULL,
    [idTecnicoActual] int NULL,
    [idClienteActual] int NULL,
    [fechaIngreso] datetime NULL DEFAULT (getdate()),
    [notas] nvarchar(max) NULL
);
GO
