CREATE   PROCEDURE Inv_sp_seg_permisos_verificar
    @idUsuario INT,
    @modulo NVARCHAR(50),
    @accion NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    -- Esta versión simplificada asume que las reglas residen en el JSON del Rol
    -- En versiones futuras se puede expandir a una matriz de permisos granular
    SELECT 
        CAST(CASE WHEN r.reglas LIKE '%' + @modulo + ':' + @accion + '%' OR r.nombre = 'Administrador' THEN 1 ELSE 0 END AS BIT) AS tienePermiso
    FROM Inv_seg_usuarios u
    JOIN Inv_seg_roles r ON u.idRol = r.idRol
    WHERE u.idUsuario = @idUsuario;
END
GO