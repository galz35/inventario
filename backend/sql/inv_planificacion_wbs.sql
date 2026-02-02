USE Bdplaner;
GO

-- ============================================================
-- 1. TABLA DE TAREAS (WBS)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Inv_ope_tareas')
BEGIN
    CREATE TABLE Inv_ope_tareas (
        idTarea INT IDENTITY(1,1) PRIMARY KEY,
        idProyecto INT NOT NULL,
        idTareaPadre INT NULL,
        nombre NVARCHAR(255) NOT NULL,
        descripcion NVARCHAR(MAX) NULL,
        fechaInicioPrevista DATETIME NULL,
        fechaFinPrevista DATETIME NULL,
        estado NVARCHAR(50) DEFAULT 'PENDIENTE',
        orden INT DEFAULT 0,
        fechaCreacion DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (idProyecto) REFERENCES Inv_ope_proyectos(idProyecto),
        FOREIGN KEY (idTareaPadre) REFERENCES Inv_ope_tareas(idTarea)
    );
END
GO

-- ============================================================
-- 2. TABLA DE ESTIMACIÓN DE MATERIALES
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Inv_ope_estimaciones')
BEGIN
    CREATE TABLE Inv_ope_estimaciones (
        idEstimacion INT IDENTITY(1,1) PRIMARY KEY,
        idTarea INT NOT NULL,
        productoId INT NOT NULL,
        cantidad DECIMAL(18,2) NOT NULL,
        idAlmacenSugerido INT NULL,
        fechaRegistro DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (idTarea) REFERENCES Inv_ope_tareas(idTarea)
        -- FK productoId y idAlmacenSugerido deberían existir en sus catastros
    );
END
GO

-- ============================================================
-- 3. STORED PROCEDURES
-- ============================================================

-- A. Crear Tarea
CREATE OR ALTER PROCEDURE Inv_sp_proyecto_tarea_crear
    @idProyecto INT,
    @idTareaPadre INT = NULL,
    @nombre NVARCHAR(255),
    @descripcion NVARCHAR(MAX) = NULL,
    @fechaInicio DATETIME = NULL,
    @fechaFin DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Inv_ope_tareas (idProyecto, idTareaPadre, nombre, descripcion, fechaInicioPrevista, fechaFinPrevista)
    VALUES (@idProyecto, @idTareaPadre, @nombre, @descripcion, @fechaInicio, @fechaFin);
    
    SELECT SCOPE_IDENTITY() AS idTarea;
END
GO

-- B. Obtener WBS (Jerárquico o Plano con ParentId)
CREATE OR ALTER PROCEDURE Inv_sp_proyecto_wbs_obtener
    @idProyecto INT
AS
BEGIN
    SET NOCOUNT ON;
    -- Retornamos lista plana, el frontend arma el árbol o lo ordenamos por jerarquía basic
    SELECT 
        t.idTarea,
        t.idProyecto,
        t.idTareaPadre,
        t.nombre,
        t.descripcion,
        t.fechaInicioPrevista,
        t.fechaFinPrevista,
        t.estado,
        (SELECT COUNT(*) FROM Inv_ope_tareas sub WHERE sub.idTareaPadre = t.idTarea) as hasChildren
    FROM Inv_ope_tareas t
    WHERE t.idProyecto = @idProyecto
    ORDER BY t.idTareaPadre, t.orden, t.idTarea;
END
GO

-- C. Estimar Material
CREATE OR ALTER PROCEDURE Inv_sp_proyecto_material_estimar
    @idTarea INT,
    @productoId INT,
    @cantidadEstimada DECIMAL(18,2),
    @idAlmacenSugerido INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Inv_ope_estimaciones (idTarea, productoId, cantidad, idAlmacenSugerido)
    VALUES (@idTarea, @productoId, @cantidadEstimada, @idAlmacenSugerido);
    
    SELECT SCOPE_IDENTITY() AS idEstimacion;
END
GO

-- D. Obtener Presupuesto vs Real (Simple)
CREATE OR ALTER PROCEDURE Inv_sp_proyecto_presupuesto_vs_real
    @idProyecto INT
AS
BEGIN
    SET NOCOUNT ON;
    -- Resumen agrupado por producto para todo el proyecto
    SELECT 
        e.productoId,
        p.nombre as productoNombre,
        SUM(e.cantidad) as totalEstimado,
        0 as totalReal -- Placeholder: Aquí sumaríamos consumos reales de la tabla de OTs vinculadas
    FROM Inv_ope_estimaciones e
    JOIN Inv_ope_tareas t ON e.idTarea = t.idTarea
    LEFT JOIN Inv_cat_productos p ON e.productoId = p.idProducto
    WHERE t.idProyecto = @idProyecto
    GROUP BY e.productoId, p.nombre;
END
GO

PRINT '✅ SPs de Planificación e Inventario Estimado actualizados.';
