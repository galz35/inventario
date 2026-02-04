
            CREATE   PROCEDURE Inv_sp_proyecto_material_estimar
                @idTarea INT,
                @productoId INT,
                @cantidadEstimada DECIMAL(18,2),
                @idAlmacenSugerido INT = NULL
            AS
            BEGIN
                SET NOCOUNT ON;
                INSERT INTO Inv_ope_estimaciones (idTarea, productoId, cantidad, idAlmacenSugerido)
                VALUES (@idTarea, @productoId, @cantidadEstimada, @idAlmacenSugerido);
                
                SELECT SCOPE_IDENTITY() AS idEstimacion;
            END
        
GO