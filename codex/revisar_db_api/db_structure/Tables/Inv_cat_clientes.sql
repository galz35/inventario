CREATE TABLE [dbo].[Inv_cat_clientes] (
    [idCliente] int IDENTITY(1,1) NOT NULL,
    [nombre] nvarchar(150) NULL,
    [identificacion] nvarchar(50) NULL,
    [direccion] nvarchar(250) NULL,
    [telefono] nvarchar(20) NULL,
    [email] nvarchar(100) NULL,
    [activo] bit NULL DEFAULT ((1))
);
GO
