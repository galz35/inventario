USE Bdplaner;
GO

-- 1. Asegurar Presencia de Roles
IF NOT EXISTS (SELECT 1 FROM p_Roles WHERE nombre = 'ADMIN')
    INSERT INTO p_Roles (nombre, descripcion) VALUES ('ADMIN', 'Administrador total del sistema');

IF NOT EXISTS (SELECT 1 FROM p_Roles WHERE nombre = 'TECNICO')
    INSERT INTO p_Roles (nombre, descripcion) VALUES ('TECNICO', 'Personal de campo ejecutor de OTs');

IF NOT EXISTS (SELECT 1 FROM p_Roles WHERE nombre = 'SUPERVISOR')
    INSERT INTO p_Roles (nombre, descripcion) VALUES ('SUPERVISOR', 'Encargado de cuadrillas y logística');

IF NOT EXISTS (SELECT 1 FROM p_Roles WHERE nombre = 'AUDITOR')
    INSERT INTO p_Roles (nombre, descripcion) VALUES ('AUDITOR', 'Control de calidad y cumplimiento');

GO

-- 2. Crear Usuarios de Prueba (Password: admin123)
DECLARE @hash NVARCHAR(500) = '$2b$10$bNz.oJVSdHwQelOdge8hpu1MKgnGGUy.j8V.xpT6ONQrMIFKMKChS';

-- Admin
IF NOT EXISTS (SELECT 1 FROM p_Usuarios WHERE correo = 'admin@test.com')
BEGIN
    INSERT INTO p_Usuarios (nombre, nombreCompleto, correo, carnet, idRol, activo)
    VALUES ('Admin Test', 'Administrador de Pruebas', 'admin@test.com', 'CADMIN01', (SELECT idRol FROM p_Roles WHERE nombre = 'ADMIN'), 1);
    
    INSERT INTO p_UsuariosCredenciales (idUsuario, passwordHash)
    VALUES ((SELECT idUsuario FROM p_Usuarios WHERE correo = 'admin@test.com'), @hash);
END

-- Tecnico
IF NOT EXISTS (SELECT 1 FROM p_Usuarios WHERE correo = 'tecnico@test.com')
BEGIN
    INSERT INTO p_Usuarios (nombre, nombreCompleto, correo, carnet, idRol, activo)
    VALUES ('Tecnico Test', 'Tecnico de Campo Uno', 'tecnico@test.com', 'CTEC01', (SELECT idRol FROM p_Roles WHERE nombre = 'TECNICO'), 1);
    
    INSERT INTO p_UsuariosCredenciales (idUsuario, passwordHash)
    VALUES ((SELECT idUsuario FROM p_Usuarios WHERE correo = 'tecnico@test.com'), @hash);
END

-- Supervisor
IF NOT EXISTS (SELECT 1 FROM p_Usuarios WHERE correo = 'super@test.com')
BEGIN
    INSERT INTO p_Usuarios (nombre, nombreCompleto, correo, carnet, idRol, activo)
    VALUES ('Supervisor Test', 'Supervisor Logistica', 'super@test.com', 'CSUP01', (SELECT idRol FROM p_Roles WHERE nombre = 'SUPERVISOR'), 1);
    
    INSERT INTO p_UsuariosCredenciales (idUsuario, passwordHash)
    VALUES ((SELECT idUsuario FROM p_Usuarios WHERE correo = 'super@test.com'), @hash);
END

-- Auditor
IF NOT EXISTS (SELECT 1 FROM p_Usuarios WHERE correo = 'auditor@test.com')
BEGIN
    INSERT INTO p_Usuarios (nombre, nombreCompleto, correo, carnet, idRol, activo)
    VALUES ('Auditor Test', 'Auditor Interno', 'auditor@test.com', 'CAUD01', (SELECT idRol FROM p_Roles WHERE nombre = 'AUDITOR'), 1);
    
    INSERT INTO p_UsuariosCredenciales (idUsuario, passwordHash)
    VALUES ((SELECT idUsuario FROM p_Usuarios WHERE correo = 'auditor@test.com'), @hash);
END

GO
PRINT '✅ Usuarios de prueba creados (Password para todos: admin123).';
