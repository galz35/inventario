CREATE TABLE [dbo].[Inv_ope_proyecto_material_estimado] (
    [idTarea] int NOT NULL,
    [productoId] int NOT NULL,
    [cantidadEstimada] decimal(18,2) NOT NULL,
    [idAlmacenSugerido] int NULL
);
GO
