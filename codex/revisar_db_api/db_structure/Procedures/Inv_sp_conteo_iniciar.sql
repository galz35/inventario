CREATE   PROCEDURE Inv_sp_conteo_iniciar
    @almacenId INT,
    @idUsuario INT,
    @notas NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    -- No permitir más de un conteo abierto por almacén
    IF EXISTS (SELECT 1 FROM Inv_inv_conteos_cabecera WHERE almacenId = @almacenId AND estado = 'ABIERTO')
        THROW 50000, 'Ya existe un conteo abierto para este almacén.', 1;

    INSERT INTO Inv_inv_conteos_cabecera (almacenId, idUsuarioInicia, notas)
    OUTPUT INSERTED.idConteo
    VALUES (@almacenId, @idUsuario, @notas);
END
GO