import { Injectable, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';

@Injectable()
export class ExcelService {
  /**
   * Procesa un archivo Excel desde un Buffer (Base64)
   * Retorna un array de objetos con los datos del excel
   */
  async parseExcel(base64: string): Promise<any[]> {
    try {
      const buffer = Buffer.from(base64, 'base64');
      const workbook = XLSX.read(buffer, { type: 'buffer' });

      // Tomamos la primera hoja
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // Convertimos a JSON
      const data = XLSX.utils.sheet_to_json(worksheet);

      if (!data || data.length === 0) {
        throw new BadRequestException('El archivo Excel está vacío.');
      }

      return data;
    } catch (error) {
      throw new BadRequestException(
        'Fallo al procesar el archivo Excel: ' + error.message,
      );
    }
  }

  /**
   * Mapea los datos del Excel a un formato que el sistema entiende para carga de stock
   * Estructura esperada en Excel: Codigo, Cantidad, AlmacenID, Propietario, ProveedorID
   */
  mapStockImport(data: any[]) {
    return data.map((row, index) => {
      // Validaciones básicas de columnas obligatorias
      if (!row.Codigo || !row.Cantidad) {
        throw new BadRequestException(
          `Fila ${index + 1}: Faltan campos obligatorios (Codigo o Cantidad)`,
        );
      }

      return {
        codigo: String(row.Codigo).trim(),
        cantidad: parseFloat(row.Cantidad),
        almacenId: row.AlmacenID ? parseInt(row.AlmacenID) : null,
        propietarioTipo: row.Propietario || 'EMPRESA',
        proveedorId: row.ProveedorID ? parseInt(row.ProveedorID) : 0,
        costoUnitario: row.Costo ? parseFloat(row.Costo) : 0,
      };
    });
  }
}
