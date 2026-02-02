
require('dotenv').config();
import { ejecutarQuery } from './db/base.repo';

async function checkData() {
    console.log('Checking data in Inv_ope_tareas...');
    try {
        const result = await ejecutarQuery(`
            SELECT TOP 5 idTarea, nombre, idProyecto FROM Inv_ope_tareas ORDER BY idTarea DESC
        `);
        console.log('Tasks:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error checking data:', error);
    }
}
checkData();
