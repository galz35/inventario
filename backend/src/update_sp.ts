
require('dotenv').config();
import { ejecutarQuery } from './db/base.repo';

async function updateSP() {
    console.log('Updating Inv_sp_proyecto_material_estimar...');
    try {
        await ejecutarQuery(`
            CREATE OR ALTER PROCEDURE Inv_sp_proyecto_material_estimar
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
        `);
        console.log('SP updated successfully.');
    } catch (error) {
        console.error('Error updating SP:', error);
    }
}
updateSP();
