USE Bdplaner;
GO

-- ============================================================
-- FIX: Tablas de Asignación para Planificación (WBS)
-- ============================================================

-- 1. Asegurar que existe la tabla de asignaciones
--    (El backend busca Inv_ope_proyecto_tarea_asignados, pero usaremos un nombre más estándar 'Inv_ope_tarea_asignaciones' 
--     y actualizaremos el backend para coincidir)

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Inv_ope_tarea_asignaciones')
BEGIN
    CREATE TABLE Inv_ope_tarea_asignaciones (
        idAsignacion INT IDENTITY(1,1) PRIMARY KEY,
        idTarea INT NOT NULL,
        idUsuario INT NOT NULL,
        carnet NVARCHAR(50) NULL,
        tipo NVARCHAR(50) DEFAULT 'Responsable', 
        esReasignacion BIT DEFAULT 0,
        fechaAsignacion DATETIME DEFAULT GETDATE(),
        
        -- Relaciones
        -- Nota: Asumimos que Inv_ope_tareas ya existe (por inv_planificacion_wbs.sql)
        FOREIGN KEY (idTarea) REFERENCES Inv_ope_tareas(idTarea)
        
        -- Nota: Asumimos que Inv_seg_usuarios existe (referenciado en planificacion.repo.ts exitosamente)
        -- Si fallara, habría que verificar si es p_Usuarios, pero el repo usa Inv_seg_usuarios.
    );
    
    PRINT '✅ Tabla Inv_ope_tarea_asignaciones creada.';
END
ELSE
BEGIN
    PRINT 'ℹ️ La tabla Inv_ope_tarea_asignaciones ya existe.';
END
GO
