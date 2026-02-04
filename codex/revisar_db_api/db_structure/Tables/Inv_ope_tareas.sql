CREATE TABLE [dbo].[Inv_ope_tareas] (
    [idTarea] int IDENTITY(1,1) NOT NULL,
    [idProyecto] int NOT NULL,
    [idTareaPadre] int NULL,
    [nombre] nvarchar(255) NOT NULL,
    [descripcion] nvarchar(max) NULL,
    [fechaInicioPrevista] datetime NULL,
    [fechaFinPrevista] datetime NULL,
    [estado] nvarchar(50) NULL DEFAULT ('PENDIENTE'),
    [orden] int NULL DEFAULT ((0)),
    [fechaCreacion] datetime NULL DEFAULT (getdate())
);
GO
