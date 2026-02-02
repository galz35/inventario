USE Bdplaner;
GO

-- CREATE Inv_ope_ot if not exists (Basic Structure needed for FK)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Inv_ope_ot')
BEGIN
    CREATE TABLE Inv_ope_ot (
        idOT INT IDENTITY(1,1) PRIMARY KEY,
        idProyecto INT NOT NULL,
        idCliente INT NOT NULL,
        idTipoOT INT NOT NULL,
        prioridad NVARCHAR(20) DEFAULT 'MEDIA',
        direccion NVARCHAR(255) NOT NULL,
        notas NVARCHAR(MAX) NULL,
        fechaCreacion DATETIME DEFAULT GETDATE(),
        estado NVARCHAR(50) DEFAULT 'REGISTRADA',
        idTecnico INT NULL,
        idUsuarioCrea INT NULL,
        idUsuarioCierra INT NULL, 
        fechaCierre DATETIME NULL,
        FOREIGN KEY (idProyecto) REFERENCES Inv_ope_proyectos(idProyecto)
    );
END
GO

-- 1. Agregar columna idTarea a la tabla de OTs si no existe
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Inv_ope_ot') AND name = 'idTarea')
BEGIN
    ALTER TABLE Inv_ope_ot ADD idTarea INT NULL;
    ALTER TABLE Inv_ope_ot ADD CONSTRAINT FK_Inv_ope_ot_Tareas FOREIGN KEY (idTarea) REFERENCES Inv_ope_tareas(idTarea);
    PRINT '✅ Columna idTarea agregada a Inv_ope_ot';
END
GO
