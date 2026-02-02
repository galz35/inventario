-- =============================================
-- Correction of SP: Inv_sp_ot_crear
-- Reason: "Too many arguments" error fixes + Support for Manual Clients
-- =============================================

CREATE OR ALTER PROCEDURE [dbo].[Inv_sp_ot_crear]
    @idProyecto INT = NULL,
    @idCliente INT = NULL,
    @idTipoOT INT,
    @prioridad NVARCHAR(50), -- 'BAJA', 'MEDIA', 'ALTA', 'CRITICA'
    @direccion NVARCHAR(255),
    @idUsuarioCrea INT,
    @notas NVARCHAR(MAX) = NULL,
    -- New Fields for Manual Clients / Extra Info
    @numeroCliente NVARCHAR(50) = NULL,
    @contactoNombre NVARCHAR(100) = NULL,
    @telefono NVARCHAR(50) = NULL,
    @correo NVARCHAR(100) = NULL,
    @descripcionTrabajo NVARCHAR(MAX) = NULL,
    @clienteNombre NVARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Validation
    IF @idCliente IS NULL AND @clienteNombre IS NULL
    BEGIN
        RAISERROR('Debe especificar un Cliente (ID) o un Nombre de Cliente manual.', 16, 1);
        RETURN;
    END

    -- 2. Insert
    INSERT INTO Inv_ope_ot (
        idProyecto, idCliente, idTipoOT, prioridad, direccion, 
        idUsuarioCrea, notas, numeroCliente, contactoNombre, 
        telefono, correo, descripcionTrabajo, clienteNombreManual,
        fechaCreacion, estado
    )
    VALUES (
        @idProyecto, @idCliente, @idTipoOT, @prioridad, @direccion,
        @idUsuarioCrea, @notas, @numeroCliente, @contactoNombre,
        @telefono, @correo, @descripcionTrabajo, @clienteNombre,
        GETDATE(), 'REGISTRADA'
    );

    -- 3. Return ID
    SELECT SCOPE_IDENTITY() as idOT;
END
GO
