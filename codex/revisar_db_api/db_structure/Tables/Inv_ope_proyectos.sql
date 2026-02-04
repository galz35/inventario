CREATE TABLE [dbo].[Inv_ope_proyectos] (
    [idProyecto] int IDENTITY(1,1) NOT NULL,
    [nombre] nvarchar(150) NOT NULL,
    [descripcion] nvarchar(max) NULL,
    [estado] nvarchar(20) NULL DEFAULT ('PLANIFICADO'),
    [fechaInicio] datetime NULL,
    [fechaFin] datetime NULL,
    [idResponsable] int NULL,
    [idAlmacenProyecto] int NULL,
    [fechaCreacion] datetime NULL DEFAULT (getdate())
);
GO
