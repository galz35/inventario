CREATE   PROCEDURE Inv_sp_inv_transferencia_enviar
    @almacenOrigenId INT,
    @almacenDestinoId INT,
    @idUsuarioEnvia INT,
    @notas NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Inv_inv_transferencias (almacenOrigenId, almacenDestinoId, idUsuarioEnvia, fechaEnvio, estado, notas)
    OUTPUT INSERTED.idTransferencia
    VALUES (@almacenOrigenId, @almacenDestinoId, @idUsuarioEnvia, GETDATE(), 'EN_TRANSITO', @notas);
END
GO