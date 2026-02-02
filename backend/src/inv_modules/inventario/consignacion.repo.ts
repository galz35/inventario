import { ejecutarSP, Int, DateTime, NVarChar, ejecutarQuery } from '../../db/base.repo';

export async function calcularLiquidacion(
  proveedorId: number,
  fechaInicio: Date,
  fechaFin: Date,
) {
  return await ejecutarSP('Inv_sp_rep_consignacion_calcular', {
    proveedorId: { valor: proveedorId, tipo: Int },
    fechaInicio: { valor: fechaInicio, tipo: DateTime },
    fechaFin: { valor: fechaFin, tipo: DateTime },
  });
}

export async function procesarLiquidacion(dto: {
  proveedorId: number;
  idUsuario: number;
  fechaInicio: Date;
  fechaFin: Date;
  notas?: string;
}) {
  return await ejecutarSP('Inv_sp_inv_liquidacion_procesar', {
    proveedorId: { valor: dto.proveedorId, tipo: Int },
    idUsuario: { valor: dto.idUsuario, tipo: Int },
    fechaInicio: { valor: dto.fechaInicio, tipo: DateTime },
    fechaFin: { valor: dto.fechaFin, tipo: DateTime },
    notas: { valor: dto.notas || null, tipo: NVarChar },
  });
}

export async function obtenerLiquidaciones() {
  return await ejecutarSP('Inv_sp_inv_liquidacion_listar', {});
}

export async function obtenerResumenProveedor(idProveedor: number) {
  // 1. Stock Consignado
  const stock = await ejecutarQuery(`
        SELECT 
            p.nombre as producto, p.codigo,
            a.nombre as almacen,
            s.cantidad, p.unidad
        FROM Inv_inv_stock s
        JOIN Inv_cat_productos p ON s.productoId = p.idProducto
        JOIN Inv_cat_almacenes a ON s.almacenId = a.idAlmacen
        WHERE s.proveedorId = ${idProveedor} AND s.cantidad > 0
    `);

  // 2. Historial Liquidaciones
  // Assuming table name Inv_ope_liquidaciones from SP naming convention
  // If it fails, I will fix.
  const historial = await ejecutarQuery(`
        SELECT * FROM Inv_ope_liquidaciones 
        WHERE proveedorId = ${idProveedor}
        ORDER BY fechaCorte DESC
    `).catch(() => []); // Fail safe if table differs

  return { stock, historial };
}
