
require('dotenv').config();
import { ejecutarQuery } from './db/base.repo';

async function fixEstimacionesTable() {
    console.log('Fixing Inv_ope_estimaciones table...');
    try {
        await ejecutarQuery(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Inv_ope_estimaciones')
            BEGIN
                CREATE TABLE Inv_ope_estimaciones (
                    idEstimacion INT IDENTITY(1,1) PRIMARY KEY,
                    idTarea INT NOT NULL,
                    productoId INT NOT NULL,
                    cantidad DECIMAL(18,2) NOT NULL,
                    idAlmacenSugerido INT NULL,
                    fechaRegistro DATETIME DEFAULT GETDATE(),
                    FOREIGN KEY (idTarea) REFERENCES Inv_ope_tareas(idTarea)
                );
                PRINT 'Table Inv_ope_estimaciones created.';
            END
            ELSE
            BEGIN
                PRINT 'Table Inv_ope_estimaciones already exists.';
            END
        `);
    } catch (error) {
        console.error('Error fixing table:', error);
    }
}
fixEstimacionesTable();
