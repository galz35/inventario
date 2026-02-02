
require('dotenv').config();
import { ejecutarQuery } from './db/base.repo';

async function checkOldData() {
    console.log('Checking data in Inv_ope_proyecto_tareas...');
    try {
        const result = await ejecutarQuery(`
            SELECT TOP 5 idTarea, nombre, idProyecto FROM Inv_ope_proyecto_tareas ORDER BY idTarea DESC
        `);
        console.log('Old Tasks:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.log('Old table might not exist or empty.', error.message);
    }
}
checkOldData();
