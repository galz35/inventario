CREATE TABLE [dbo].[Inv_ope_estimaciones] (
    [idEstimacion] int IDENTITY(1,1) NOT NULL,
    [idTarea] int NOT NULL,
    [productoId] int NOT NULL,
    [cantidad] decimal(18,2) NOT NULL,
    [idAlmacenSugerido] int NULL,
    [fechaRegistro] datetime NULL DEFAULT (getdate())
);
GO
