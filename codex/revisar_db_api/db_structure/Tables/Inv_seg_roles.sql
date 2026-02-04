CREATE TABLE [dbo].[Inv_seg_roles] (
    [idRol] int IDENTITY(1,1) NOT NULL,
    [nombre] nvarchar(50) NOT NULL,
    [descripcion] nvarchar(200) NULL,
    [reglas] nvarchar(max) NULL DEFAULT ('[]'),
    [activo] bit NULL DEFAULT ((1)),
    [fechaCreacion] datetime NULL DEFAULT (getdate()),
    [actualizadoPor] int NULL,
    [esSistema] bit NULL DEFAULT ((0)),
    [defaultMenu] nvarchar(max) NULL
);
GO
