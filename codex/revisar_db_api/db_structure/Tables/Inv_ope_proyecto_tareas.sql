CREATE TABLE [dbo].[Inv_ope_proyecto_tareas] (
    [idTarea] int IDENTITY(1,1) NOT NULL,
    [idProyecto] int NOT NULL,
    [idTareaPadre] int NULL,
    [nombre] nvarchar(200) NOT NULL,
    [descripcion] nvarchar(max) NULL,
    [fechaInicioPrevista] datetime NULL,
    [fechaFinPrevista] datetime NULL,
    [orden] int NULL DEFAULT ((0)),
    [estado] nvarchar(50) NULL DEFAULT ('PLANIFICADA')
);
GO
