CREATE TABLE [dbo].[Inv_seg_usuarios] (
    [idUsuario] int IDENTITY(1,1) NOT NULL,
    [nombre] nvarchar(100) NOT NULL,
    [correo] nvarchar(100) NOT NULL,
    [carnet] nvarchar(20) NOT NULL,
    [password] nvarchar(255) NULL,
    [idRol] int NULL,
    [idAlmacenTecnico] int NULL,
    [activo] bit NULL DEFAULT ((1)),
    [fechaCreacion] datetime NULL DEFAULT (getdate()),
    [ultimoAcceso] datetime NULL,
    [refreshToken] nvarchar(max) NULL
);
GO
