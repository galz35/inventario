-- SCRIPT DE SEEDING (INVCORE)
-- Configuración de Roles y Usuarios Iniciales

USE inventario;
GO

-- 1. Limpiar e Insertar Roles
DELETE FROM Inv_seg_roles;
INSERT INTO Inv_seg_roles (nombre, descripcion, reglas)
VALUES 
('ADMIN', 'Administrador Total del Sistema', '["*"]'),
('TECNICO', 'Técnico de Campo - Solo sus OTs y Stock', '["inv.stock.view", "ope.ot.manage"]'),
('AUDITOR', 'Auditor de Inventario', '["inv.stock.view", "inv.audit.manage"]'),
('SUPERVISOR', 'Supervisor de Operaciones', '["inv.stock.view", "ope.proyectos.view", "repo.view"]');

-- 2. Asegurar que existan Almacenes base
IF NOT EXISTS (SELECT 1 FROM Inv_cat_almacenes WHERE tipo = 'CENTRAL')
INSERT INTO Inv_cat_almacenes (nombre, tipo, ubicacion) VALUES ('BODEGA CENTRAL', 'CENTRAL', 'Plataforma Principal');

-- 3. Crear Usuarios Base (Contraseña: admin123 hash placeholder)
-- Nota: En producción usar contraseñas reales hasheadas por el backend.
DELETE FROM Inv_seg_usuarios;

DECLARE @idAdmin INT, @idTecnico INT;

INSERT INTO Inv_seg_usuarios (nombre, correo, carnet, password, idRol)
SELECT 'Administrador Sistema', 'admin@empresa.com', 'CORP001', '$2b$10$q.F9dE3ZpY9v6K/vXy.9OeyfA3K/K6Yv6K/vXy.9OeyfA3K/K6Yv', r.idRol
FROM Inv_seg_roles r WHERE r.nombre = 'ADMIN';

INSERT INTO Inv_seg_usuarios (nombre, correo, carnet, password, idRol)
SELECT 'Técnico Juan Perez', 'juan.perez@empresa.com', 'TEC001', '$2b$10$q.F9dE3ZpY9v6K/vXy.9OeyfA3K/K6Yv6K/vXy.9OeyfA3K/K6Yv', r.idRol
FROM Inv_seg_roles r WHERE r.nombre = 'TECNICO';

PRINT 'Seed completado con éxito.';
GO
