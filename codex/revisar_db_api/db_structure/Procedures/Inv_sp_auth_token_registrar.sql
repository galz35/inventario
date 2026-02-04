CREATE   PROCEDURE Inv_sp_auth_token_registrar
    @idUsuario INT,
    @token NVARCHAR(500),
    @expira DATETIME
AS
BEGIN
    -- Revocar tokens anteriores para el mismo usuario (opcional, por seguridad)
    UPDATE Inv_seg_refresh_tokens SET revocado = GETDATE() WHERE idUsuario = @idUsuario AND revocado IS NULL;

    INSERT INTO Inv_seg_refresh_tokens (idUsuario, token, expira)
    VALUES (@idUsuario, @token, @expira);
END
GO