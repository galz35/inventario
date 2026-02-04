CREATE   PROCEDURE Inv_sp_conteo_finalizar
    @idConteo INT,
    @idUsuario INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION
    BEGIN TRY
        UPDATE Inv_inv_conteos_cabecera 
        SET estado = 'FINALIZADO', fechaFin = GETDATE() 
        WHERE idConteo = @idConteo;

        -- Generar Ajustes de Stock basados en las diferencias
        DECLARE @pId INT, @dif DECIMAL(18,2), @almId INT;
        SELECT @almId = almacenId FROM Inv_inv_conteos_cabecera WHERE idConteo = @idConteo;

        DECLARE cur CURSOR FOR SELECT productoId, diferencia FROM Inv_inv_conteos_detalle WHERE idConteo = @idConteo AND diferencia <> 0;
        OPEN cur;
        FETCH NEXT FROM cur INTO @pId, @dif;
        WHILE @@FETCH_STATUS = 0
        BEGIN
            DECLARE @nuevaCant DECIMAL(18,2);
            SELECT @nuevaCant = ISNULL(SUM(cantidad), 0) + @dif FROM Inv_inv_stock WHERE almacenId = @almId AND productoId = @pId AND propietarioTipo = 'EMPRESA';

            -- Usar el procedimiento oficial de ajuste
            EXEC Inv_sp_inv_stock_ajustar 
                @almacenId = @almId, 
                @productoId = @pId, 
                @nuevaCantidad = @nuevaCant, 
                @motivo = 'Ajuste automático por Conteo Físico', 
                @idUsuario = @idUsuario;

            FETCH NEXT FROM cur INTO @pId, @dif;
        END
        CLOSE cur;
        DEALLOCATE cur;

        COMMIT TRANSACTION
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO