CREATE TABLE [dbo].[Inv_ope_tarea_asignaciones] (
    [idAsignacion] int IDENTITY(1,1) NOT NULL,
    [idTarea] int NOT NULL,
    [idUsuario] int NOT NULL,
    [carnet] nvarchar(50) NULL,
    [tipo] nvarchar(50) NULL DEFAULT ('Responsable'),
    [esReasignacion] bit NULL DEFAULT ((0)),
    [fechaAsignacion] datetime NULL DEFAULT (getdate())
);
GO
