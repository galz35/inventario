CREATE   PROCEDURE Inv_sp_auth_token_validar
    @token NVARCHAR(500)
AS
BEGIN
    SELECT idUsuario 
    FROM Inv_seg_refresh_tokens 
    WHERE token = @token AND revocado IS NULL AND expira > GETDATE();
END
GO