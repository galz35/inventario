-- Migration script to enhance Work Order (OT) with full data
USE inventario;
GO

-- 1. Ensure Types exist
IF NOT EXISTS (SELECT 1 FROM Inv_cat_tipos_ot WHERE nombre = 'Instalación')
    INSERT INTO Inv_cat_tipos_ot (nombre, requiereFirma, requiereEvidencia, requiereEquipoSerializado) VALUES ('Instalación', 1, 1, 1);

IF NOT EXISTS (SELECT 1 FROM Inv_cat_tipos_ot WHERE nombre = 'Mantenimiento')
    INSERT INTO Inv_cat_tipos_ot (nombre, requiereFirma, requiereEvidencia, requiereEquipoSerializado) VALUES ('Mantenimiento', 1, 0, 0);

IF NOT EXISTS (SELECT 1 FROM Inv_cat_tipos_ot WHERE nombre = 'Reparación')
    INSERT INTO Inv_cat_tipos_ot (nombre, requiereFirma, requiereEvidencia, requiereEquipoSerializado) VALUES ('Reparación', 1, 1, 0);

-- 2. Add fields to Inv_ope_ot if they don't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Inv_ope_ot') AND name = 'numeroCliente')
    ALTER TABLE Inv_ope_ot ADD numeroCliente NVARCHAR(50);

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Inv_ope_ot') AND name = 'contactoNombre')
    ALTER TABLE Inv_ope_ot ADD contactoNombre NVARCHAR(100);

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Inv_ope_ot') AND name = 'telefono')
    ALTER TABLE Inv_ope_ot ADD telefono NVARCHAR(20);

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Inv_ope_ot') AND name = 'correo')
    ALTER TABLE Inv_ope_ot ADD correo NVARCHAR(100);

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Inv_ope_ot') AND name = 'descripcionTrabajo')
    ALTER TABLE Inv_ope_ot ADD descripcionTrabajo NVARCHAR(MAX);

-- Columns that might be missing depending on which schema was used
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Inv_ope_ot') AND name = 'idCliente')
    ALTER TABLE Inv_ope_ot ADD idCliente INT NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Inv_ope_ot') AND name = 'idTipoOT')
    ALTER TABLE Inv_ope_ot ADD idTipoOT INT NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Inv_ope_ot') AND name = 'idUsuarioCrea')
    ALTER TABLE Inv_ope_ot ADD idUsuarioCrea INT NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Inv_ope_ot') AND name = 'clienteNombre')
    ALTER TABLE Inv_ope_ot ADD clienteNombre NVARCHAR(150);

GO

-- 3. Update Inv_sp_ot_crear to handle new fields
CREATE OR ALTER PROCEDURE Inv_sp_ot_crear
    @idProyecto INT = NULL,
    @idCliente INT = NULL,
    @idTipoOT INT,
    @prioridad NVARCHAR(20),
    @direccion NVARCHAR(MAX),
    @idUsuarioCrea INT,
    @notas NVARCHAR(MAX) = NULL,
    @numeroCliente NVARCHAR(50) = NULL,
    @contactoNombre NVARCHAR(100) = NULL,
    @telefono NVARCHAR(20) = NULL,
    @correo NVARCHAR(100) = NULL,
    @descripcionTrabajo NVARCHAR(MAX) = NULL,
    @clienteNombre NVARCHAR(150) = NULL
AS
BEGIN
    INSERT INTO Inv_ope_ot (
        idProyecto, idCliente, idTipoOT, prioridad, direccion, 
        idUsuarioCrea, estado, notas, fechaCreacion,
        numeroCliente, contactoNombre, telefono, correo, descripcionTrabajo,
        clienteNombre
    )
    OUTPUT INSERTED.idOT
    VALUES (
        @idProyecto, @idCliente, @idTipoOT, @prioridad, @direccion, 
        @idUsuarioCrea, 'REGISTRADA', @notas, GETDATE(),
        @numeroCliente, @contactoNombre, @telefono, @correo, @descripcionTrabajo,
        @clienteNombre
    );
END
GO


-- 4. Improved Listing SP
CREATE OR ALTER PROCEDURE Inv_sp_ot_listar_completo
    @idTecnico INT = NULL,
    @estado NVARCHAR(50) = NULL
AS
BEGIN
    SELECT 
        ot.*,
        p.nombre AS proyectoNombre,
        t.nombre AS tipoOTNombre,
        u.nombre AS tecnicoNombre,
        uc.nombre AS usuarioCreaNombre
    FROM Inv_ope_ot ot
    LEFT JOIN Inv_ope_proyectos p ON ot.idProyecto = p.idProyecto
    LEFT JOIN Inv_cat_tipos_ot t ON ot.idTipoOT = t.idTipoOT
    LEFT JOIN Inv_seg_usuarios u ON ot.idTecnicoAsignado = u.idUsuario
    LEFT JOIN Inv_seg_usuarios uc ON ot.idUsuarioCrea = uc.idUsuario
    WHERE (@idTecnico IS NULL OR ot.idTecnicoAsignado = @idTecnico)
      AND (@estado IS NULL OR ot.estado = @estado)
    ORDER BY ot.idOT DESC;
END
GO
