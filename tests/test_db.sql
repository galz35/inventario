-- SCRIPT DE PRUEBA DE BASE DE DATOS (INVCORE)
-- Ejecutar en SQL Server Management Studio

USE inventario;
GO

PRINT '--- INICIANDO PRUEBAS DE BASE DE DATOS ---';

-- 1. Prueba de Catálogos
PRINT '>> Probando Catálogos...';
SELECT 'Almacenes' AS Tabla, COUNT(*) AS Registros FROM Inv_cat_almacenes;
SELECT 'Productos' AS Tabla, COUNT(*) AS Registros FROM Inv_cat_productos;
SELECT 'Usuarios' AS Tabla, COUNT(*) AS Registros FROM Inv_seg_usuarios;

-- 2. Prueba de Existencias
PRINT '>> Revisando Stock Actual...';
EXEC Inv_sp_inv_stock_obtener;

-- 3. Prueba de Procedimiento de Alerta
PRINT '>> Probando Alertas de Stock Bajo (Procedimiento)...';
EXEC Inv_sp_rep_stock_bajo;

-- 4. Prueba de Integridad de Relaciones
PRINT '>> Verificando Integridad de Relaciones (OTs por Proyecto)...';
SELECT p.nombre AS Proyecto, COUNT(ot.idOT) AS TotalOTs
FROM Inv_ope_proyectos p
LEFT JOIN Inv_ope_ot ot ON p.idProyecto = ot.idProyecto
GROUP BY p.nombre;

-- 5. Prueba de Kardex (Últimos 10 movimientos)
PRINT '>> Historial Reciente (Kardex)...';
SELECT TOP 10 m.tipoMovimiento, m.fechaMovimiento, d.productoId, d.cantidad, d.stockNuevo
FROM Inv_inv_movimientos m
JOIN Inv_inv_movimiento_detalle d ON m.idMovimiento = d.idMovimiento
ORDER BY m.fechaMovimiento DESC;

PRINT '--- PRUEBAS COMPLETADAS ---';
GO
