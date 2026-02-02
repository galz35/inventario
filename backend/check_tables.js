
const { ejecutarQuery } = require('./src/db/base.repo');

async function listTables() {
    try {
        const tables = await ejecutarQuery("SELECT name FROM sys.tables ORDER BY name");
        console.log('Tables found:', tables.map(t => t.name));

        // If p_Agenda exists, describe it
        const agenda = tables.find(t => t.name.toLowerCase() === 'p_agenda');
        if (agenda) {
            const columns = await ejecutarQuery(`
                SELECT COLUMN_NAME, DATA_TYPE 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = '${agenda.name}'
            `);
            console.log('p_Agenda columns:', columns);
        } else {
            console.log('p_Agenda table NOT found.');
        }

        // Check p_FocoDiario columns just in case
        const focoColumns = await ejecutarQuery(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'p_FocoDiario'
        `);
        console.log('p_FocoDiario columns:', focoColumns);

    } catch (e) {
        console.error(e);
    }
}

listTables();
