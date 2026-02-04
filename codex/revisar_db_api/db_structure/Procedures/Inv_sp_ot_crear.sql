
    CREATE   PROCEDURE [dbo].[Inv_sp_ot_crear]
        @idProyecto INT = NULL,
        @idCliente INT = NULL,
        @idTipoOT INT,
        @prioridad NVARCHAR(50), 
        @direccion NVARCHAR(255),
        @idUsuarioCrea INT,
        @notas NVARCHAR(MAX) = NULL,
        @numeroCliente NVARCHAR(50) = NULL,
        @contactoNombre NVARCHAR(100) = NULL,
        @telefono NVARCHAR(50) = NULL,
        @correo NVARCHAR(100) = NULL,
        @descripcionTrabajo NVARCHAR(MAX) = NULL,
        @clienteNombre NVARCHAR(200) = NULL
    AS
    BEGIN
        SET NOCOUNT ON;

        -- Mapping Logic:
        -- @direccion -> clienteDireccion
        -- @idTipoOT -> tipoOT (Converting to string if needed, or storing ID)
        -- @idCliente -> idCliente (Newly created column)
        
        INSERT INTO Inv_ope_ot (
            idProyecto, 
            idCliente, 
            tipoOT,  -- Mapped from @idTipoOT
            prioridad, 
            clienteDireccion, -- Mapped from @direccion
            idUsuarioCrea, 
            notas, 
            numeroCliente, 
            contactoNombre, 
            telefono, 
            correo, 
            descripcionTrabajo, 
            clienteNombreManual,
            fechaCreacion, 
            estado
        )
        VALUES (
            @idProyecto, 
            @idCliente, 
            CAST(@idTipoOT AS NVARCHAR(50)), -- Safe cast just in case
            @prioridad, 
            @direccion, 
            @idUsuarioCrea, 
            @notas, 
            @numeroCliente, 
            @contactoNombre, 
            @telefono, 
            @correo, 
            @descripcionTrabajo, 
            @clienteNombre,
            GETDATE(), 
            'REGISTRADA'
        );

        SELECT SCOPE_IDENTITY() as idOT;
    END
    
GO