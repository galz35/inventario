USE InventarioDB;
GO

ALTER TABLE Inv_cat_productos ADD costoPromedio DECIMAL(18,2) DEFAULT 0;
GO

ALTER TABLE Inv_cat_productos ADD minimo INT DEFAULT 5;
GO
