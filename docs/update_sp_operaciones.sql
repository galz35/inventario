-- ACTUALIZACIÓN DE PROCEDIMIENTOS: OPERACIONES (EVIDENCIAS Y FIRMAS)
USE inventario;
GO

-- 1. SP para registrar evidencia (Fotos antes/después)
CREATE OR ALTER PROCEDURE Inv_sp_ot_evidencia_registrar
    @idOT INT,
    @urlArchivo NVARCHAR(MAX),
    @tipoEvidencia NVARCHAR(20) -- FOTO_ANTES, FOTO_DESPUES, DOCUMENTO
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Inv_ope_ot_evidencias (idOT, urlArchivo, tipoEvidencia)
    VALUES (@idOT, @urlArchivo, @tipoEvidencia);
END
GO

-- 2. SP para registrar firma del cliente
CREATE OR ALTER PROCEDURE Inv_sp_ot_firma_registrar
    @idOT INT,
    @urlFirma NVARCHAR(MAX),
    @nombreFirmante NVARCHAR(100),
    @dniFirmante NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    -- Si ya existe firma para esta OT, la actualizamos
    IF EXISTS (SELECT 1 FROM Inv_ope_ot_firmas WHERE idOT = @idOT)
    BEGIN
        UPDATE Inv_ope_ot_firmas 
        SET urlFirma = @urlFirma, 
            nombreFirmante = @nombreFirmante, 
            dniFirmante = @dniFirmante, 
            fechaFirma = GETDATE()
        WHERE idOT = @idOT;
    END
    ELSE
    BEGIN
        INSERT INTO Inv_ope_ot_firmas (idOT, urlFirma, nombreFirmante, dniFirmante)
        VALUES (@idOT, @urlFirma, @nombreFirmante, @dniFirmante);
    END
END
GO

-- 3. SP para asignar técnico a OT (Por si no existía o estaba incompleto)
CREATE OR ALTER PROCEDURE Inv_sp_ot_asignar_tecnico
    @idOT INT,
    @idTecnico INT,
    @idUsuarioAsigna INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Inv_ope_ot 
    SET idTecnicoAsignado = @idTecnico,
        estado = 'ASIGNADA',
        fechaAsignacion = GETDATE()
    WHERE idOT = @idOT;
    
    -- Nota: Aquí se podría insertar en un historial de cambios de la OT si existiera la tabla
END
GO

PRINT 'Procedimientos de operaciones actualizados.';
GO
