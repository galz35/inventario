
require('dotenv').config();
import { ejecutarQuery } from './db/base.repo';

async function checkColumns() {
    console.log('Checking columns for Inv_ope_tareas...');
    try {
        const result = await ejecutarQuery(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Inv_ope_tareas'
        `);
        console.log('Columns:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error checking columns:', error);
    }
}
checkColumns();
