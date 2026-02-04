CREATE TABLE [dbo].[Inv_cat_proveedores] (
    [idProveedor] int IDENTITY(1,1) NOT NULL,
    [nombre] nvarchar(150) NOT NULL,
    [nit] nvarchar(50) NULL,
    [contacto] nvarchar(100) NULL,
    [telefono] nvarchar(50) NULL,
    [correo] nvarchar(100) NULL,
    [activo] bit NULL DEFAULT ((1)),
    [fechaCreacion] datetime NULL DEFAULT (getdate())
);
GO
