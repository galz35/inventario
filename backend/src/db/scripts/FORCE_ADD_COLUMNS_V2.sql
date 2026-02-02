ALTER TABLE Inv_cat_productos ADD costoPromedio DECIMAL(18,2) DEFAULT 0;
GO

ALTER TABLE Inv_cat_productos ADD minimo INT DEFAULT 5;
GO

-- Actualizar datos
UPDATE Inv_cat_productos SET costoPromedio = 45.00, minimo = 10 WHERE codigo = 'ONT-HUA-01';
UPDATE Inv_cat_productos SET costoPromedio = 0.50, minimo = 100 WHERE codigo = 'CABLE-UTP-CAT6';
GO
