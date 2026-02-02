-- MÓDULO DE PLANIFICACIÓN AVANZADA: WBS Y ESTIMACIONES
USE inventario;
GO

-- 1. Tareas de Proyecto (Estructura Desglosada de Trabajo - WBS)
IF OBJECT_ID('Inv_ope_proyecto_tareas', 'U') IS NULL
CREATE TABLE Inv_ope_proyecto_tareas (
    idTarea INT IDENTITY(1,1) PRIMARY KEY,
    idProyecto INT NOT NULL REFERENCES Inv_ope_proyectos(idProyecto),
    idTareaPadre INT NULL REFERENCES Inv_ope_proyecto_tareas(idTarea), -- Para subtareas
    nombre NVARCHAR(200) NOT NULL,
    descripcion NVARCHAR(MAX),
    fechaInicioPrevista DATETIME,
    fechaFinPrevista DATETIME,
    progreso DECIMAL(5,2) DEFAULT 0, -- 0.00 a 100.00
    estado NVARCHAR(20) DEFAULT 'PENDIENTE', -- PENDIENTE, PROCESO, COMPLETADA
    orden INT DEFAULT 0
);

-- 2. Estimación de Materiales por Tarea (Presupuesto de Materiales)
IF OBJECT_ID('Inv_ope_proyecto_material_estimado', 'U') IS NULL
CREATE TABLE Inv_ope_proyecto_material_estimado (
    idEstimacion INT IDENTITY(1,1) PRIMARY KEY,
    idTarea INT NOT NULL REFERENCES Inv_ope_proyecto_tareas(idTarea),
    productoId INT NOT NULL REFERENCES Inv_cat_productos(idProducto),
    cantidadEstimada DECIMAL(18,2) NOT NULL,
    cantidadConsumidaReal DECIMAL(18,2) DEFAULT 0, -- Se actualiza cuando se cierra una OT vinculada
    idAlmacenSugerido INT NULL REFERENCES Inv_cat_almacenes(idAlmacen)
);

-- 3. Vincular OT a una Tarea específica del WBS
-- Agregamos la columna a la tabla existente si no existe
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Inv_ope_ot') AND name = 'idTareaWBS')
BEGIN
    ALTER TABLE Inv_ope_ot ADD idTareaWBS INT NULL REFERENCES Inv_ope_proyecto_tareas(idTarea);
END

PRINT 'Estructura de Planificación (WBS y Estimaciones) creada con éxito.';
GO
