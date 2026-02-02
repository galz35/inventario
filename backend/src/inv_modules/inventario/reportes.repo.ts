import {
  Int,
  DateTime,
  Decimal,
  ejecutarSP,
  NVarChar,
  ejecutarQuery,
} from '../../db/base.repo';

/**
 * Obtiene métricas generales para el dashboard principal
 */
export async function getDashboardMetrics(userId: number, roleId: number) {
  const res = await ejecutarSP('Inv_sp_dashboard_resumen', {
    idUsuario: { valor: userId, tipo: Int },
    idRol: { valor: roleId, tipo: Int },
  });
  return res[0];
}

/**
 * Reporte de materiales consumidos agrupados por proyecto
 */
export async function reporteConsumoPorProyecto(
  idProyecto?: number,
  fechaInicio?: Date,
  fechaFin?: Date,
) {
  return await ejecutarSP('Inv_sp_repo_consumo_por_proyecto', {
    idProyecto: { valor: idProyecto || null, tipo: Int },
    fechaInicio: { valor: fechaInicio || null, tipo: DateTime },
    fechaFin: { valor: fechaFin || null, tipo: DateTime },
  });
}

/**
 * Reporte de cumplimiento de SLA en Órdenes de Trabajo
 */
export async function reporteSLA(fechaInicio?: Date, fechaFin?: Date) {
  return await ejecutarSP('Inv_sp_rep_ot_sla_tiempos', {
    fechaInicio: { valor: fechaInicio || null, tipo: DateTime },
    fechaFin: { valor: fechaFin || null, tipo: DateTime },
  });
}

/**
 * Lista de productos que están por debajo del stock mínimo
 */
export async function reporteStockBajo(almacenId?: number) {
  return await ejecutarSP('Inv_sp_rep_stock_bajo', {
    almacenId: { valor: almacenId || null, tipo: Int },
  });
}

/**
 * Reporte de materiales consumidos por cada técnico
 */
export async function reporteConsumoPorTecnico(
  fechaInicio?: Date,
  fechaFin?: Date,
) {
  return await ejecutarSP('Inv_sp_rep_consumo_por_tecnico', {
    fechaInicio: { valor: fechaInicio || null, tipo: DateTime },
    fechaFin: { valor: fechaFin || null, tipo: DateTime },
  });
}

/**
 * Resumen del estado actual de todos los activos serializados
 */
export async function reporteActivosEstado() {
  return await ejecutarSP('Inv_sp_rep_activos_estado', {});
}

/**
 * Obtiene el inventario asignado específicamente al usuario (técnico)
 */
export async function reporteMiStock(userId: number) {
  const resUser = await ejecutarQuery<{ idAlmacenTecnico: number }>(
    'SELECT idAlmacenTecnico FROM Inv_seg_usuarios WHERE idUsuario = @userId',
    { userId: { valor: userId, tipo: Int } },
  );

  const almacenId = resUser[0]?.idAlmacenTecnico;

  return await ejecutarSP('Inv_sp_inv_stock_obtener', {
    almacenId: { valor: almacenId || -1, tipo: Int },
    buscar: { valor: null, tipo: NVarChar },
  });
}

/**
 * Ajuste manual de stock para corrección de inventario
 */
export async function ajustarStock(dto: {
  almacenId: number;
  productoId: number;
  nuevaCantidad: number;
  motivo: string;
  idUsuario: number;
}) {
  return await ejecutarSP('Inv_sp_inv_stock_ajustar', {
    almacenId: { valor: dto.almacenId, tipo: Int },
    productoId: { valor: dto.productoId, tipo: Int },
    nuevaCantidad: { valor: dto.nuevaCantidad, tipo: Decimal(18, 2) },
    motivo: { valor: dto.motivo, tipo: NVarChar },
    idUsuario: { valor: dto.idUsuario, tipo: Int },
  });
}

/**
 * Reporte detallado de materiales usados por técnico en un día específico
 */
export async function reporteDetalleTecnicoDiario(fecha: string) {
  return await ejecutarQuery(`
        SELECT 
            ot.idOT as otCodigo, 
            ot.fechaCierre,
            u.nombre as tecnicoNombre,
            p.nombre as productoNombre,
            p.codigo as productoCodigo,
            oc.cantidad,
            proj.nombre as proyectoNombre
        FROM Inv_ope_ot ot
        JOIN Inv_ope_ot_consumos oc ON ot.idOT = oc.idOT
        JOIN Inv_cat_productos p ON oc.productoId = p.idProducto
        JOIN Inv_seg_usuarios u ON ot.idTecnico = u.idUsuario
        LEFT JOIN Inv_ope_proyectos proj ON ot.idProyecto = proj.idProyecto
        WHERE CAST(ot.fechaCierre AS DATE) = @fecha
        ORDER BY u.nombre, ot.fechaCierre
    `, { fecha: { valor: fecha, tipo: NVarChar } });
}
