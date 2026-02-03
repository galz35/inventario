import { utils, writeFile } from 'xlsx';

export const exportToExcel = (data: any[], fileName: string, sheetName: string = 'Datos') => {
    // 1. Create a WorkBook
    const wb = utils.book_new();

    // 2. Convert JSON data to WorkSheet
    const ws = utils.json_to_sheet(data);

    // 3. Append WorkSheet to WorkBook
    utils.book_append_sheet(wb, ws, sheetName);

    // 4. Download File
    writeFile(wb, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const formatDataForExport = (data: any[], columns: any[]) => {
    return data.map(row => {
        const formattedRow: any = {};
        columns.forEach(col => {
            // If there's a custom render, we might lose data, so we prefer raw values for Excel
            // Or try to extract text if it's simple
            if (col.key !== 'acciones') {
                // Use the raw key value
                let val = row[col.key];

                // Handle Booleans
                if (typeof val === 'boolean') val = val ? 'Sí' : 'No';

                // Handle Dates (basic check)
                if (col.key.includes('fecha') && val) {
                    val = new Date(val).toLocaleDateString();
                }

                formattedRow[col.label] = val;
            }
        });
        return formattedRow;
    });
};
