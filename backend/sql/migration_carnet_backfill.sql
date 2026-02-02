
/* =========================================================
   5) MIGRACIÓN DE IDENTIDAD: CARNET (Retroactive Update)
   ========================================================= */

-- Objetivo: Agregar columna 'carnet' a tablas transaccionales clave para facilitar reportes y búsquedas sin JOINs costosos.
-- Tablas objetivo: p_Tareas, p_Checkins, p_Bloqueos

-- 5.1 Tabla p_Tareas
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.p_Tareas') AND name = 'creadorCarnet')
BEGIN
    ALTER TABLE dbo.p_Tareas ADD creadorCarnet NVARCHAR(50) NULL;
END
GO

-- Poblar creadorCarnet
UPDATE t
SET t.creadorCarnet = u.carnet
FROM dbo.p_Tareas t
INNER JOIN dbo.p_Usuarios u ON t.idCreador = u.idUsuario
WHERE t.creadorCarnet IS NULL;
GO

-- 5.2 Tabla p_Checkins
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.p_Checkins') AND name = 'usuarioCarnet')
BEGIN
    ALTER TABLE dbo.p_Checkins ADD usuarioCarnet NVARCHAR(50) NULL;
END
GO

-- Poblar usuarioCarnet
UPDATE c
SET c.usuarioCarnet = u.carnet
FROM dbo.p_Checkins c
INNER JOIN dbo.p_Usuarios u ON c.idUsuario = u.idUsuario
WHERE c.usuarioCarnet IS NULL;
GO

-- 5.3 Tabla p_Bloqueos
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.p_Bloqueos') AND name = 'origenCarnet')
BEGIN
    ALTER TABLE dbo.p_Bloqueos ADD origenCarnet NVARCHAR(50) NULL;
END
GO

-- Poblar origenCarnet
UPDATE b
SET b.origenCarnet = u.carnet
FROM dbo.p_Bloqueos b
INNER JOIN dbo.p_Usuarios u ON b.idOrigenUsuario = u.idUsuario
WHERE b.origenCarnet IS NULL;
GO

-- 5.4 TRIGGERS (Opcional pero recomendado) para mantener consistencia
-- O simplemente asegurar que los nuevos SPs escriban el carnet.
-- VAMOS A ACTUALIZAR LOS SPs RECIEN CREADOS PARA QUE GUARDEN EL CARNET TAMBIEN.

-- (NOTA: Se requiere volver a ejecutar ALTER PROCEDURE sp_Tarea_CrearCompleta, etc. en el siguiente bloque para incluir estos campos)
