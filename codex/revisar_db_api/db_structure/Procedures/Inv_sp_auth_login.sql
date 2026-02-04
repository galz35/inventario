CREATE   PROCEDURE Inv_sp_auth_login
    @correo NVARCHAR(100),
    @password NVARCHAR(MAX) -- Debe venir hasheada desde el backend
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @idUsuario INT, @idRol INT;

    SELECT @idUsuario = idUsuario, @idRol = idRol 
    FROM Inv_seg_usuarios 
    WHERE correo = @correo AND password = @password AND activo = 1;

    IF @idUsuario IS NOT NULL
    BEGIN
        UPDATE Inv_seg_usuarios SET ultimoAcceso = GETDATE() WHERE idUsuario = @idUsuario;
        
        SELECT 
            u.idUsuario, u.nombre, u.correo, u.idRol, r.nombre AS rolNombre,
            u.idAlmacenTecnico
        FROM Inv_seg_usuarios u
        JOIN Inv_seg_roles r ON u.idRol = r.idRol
        WHERE u.idUsuario = @idUsuario;
    END
    ELSE
    BEGIN
        THROW 50002, 'Credenciales inválidas o usuario inactivo.', 1;
    END
END
GO