/**
 * Audit Repository - Gestión de Logs y Auditoría
 */
import { ejecutarQuery, Int, NVarChar, DateTime } from '../db/base.repo';
import { LogSistemaDb, AuditLogDb, ResultadoPaginado } from '../db/tipos';

// ==========================================
// ESCRITURA
// ==========================================

// ==========================================
// ESCRITURA
// ==========================================

export async function crearLogSistema(log: Partial<LogSistemaDb>) {
  await ejecutarQuery(
    `
        INSERT INTO Inv_sis_logs (idUsuario, accion, entidad, datos, fecha)
        VALUES (@idUsuario, @accion, @entidad, @datos, GETDATE())
    `,
    {
      idUsuario: { valor: log.idUsuario || null, tipo: Int },
      accion: { valor: log.accion || 'UNKNOWN', tipo: NVarChar },
      entidad: { valor: log.entidad || null, tipo: NVarChar },
      datos: { valor: log.datos || null, tipo: NVarChar },
    },
  );
}

export async function crearAuditLog(audit: Partial<AuditLogDb>) {
  await ejecutarQuery(
    `
        INSERT INTO Inv_sis_auditoria (idUsuario, accion, entidad, entidadId, datosAnteriores, datosNuevos, fecha)
        VALUES (@idUsuario, @accion, @entidad, @entidadId, @datosAnteriores, @datosNuevos, GETDATE())
    `,
    {
      idUsuario: { valor: audit.idUsuario || null, tipo: Int },
      accion: { valor: audit.accion, tipo: NVarChar },
      entidad: { valor: audit.entidad, tipo: NVarChar },
      entidadId: { valor: audit.entidadId, tipo: NVarChar },
      datosAnteriores: { valor: audit.datosAnteriores, tipo: NVarChar },
      datosNuevos: { valor: audit.datosNuevos, tipo: NVarChar },
    },
  );
}

// ==========================================
// LECTURA
// ==========================================

export async function listarLogsSistema(
  limit: number,
  offset: number,
  filtros: any = {},
) {
  const whereClause = '1=1';
  // Implementar filtros simples si se requieren
  return await ejecutarQuery<LogSistemaDb>(`
        SELECT * FROM Inv_sis_logs 
        WHERE ${whereClause}
        ORDER BY fecha DESC
        OFFSET ${Math.floor(offset)} ROWS FETCH NEXT ${Math.floor(limit)} ROWS ONLY
    `);
}

export async function contarLogsSistema(filtros: any = {}) {
  const res = await ejecutarQuery<{ total: number }>(
    `SELECT COUNT(*) as total FROM Inv_sis_logs`,
  );
  return res[0].total;
}

export async function listarAuditLogs(
  limit: number,
  offset: number,
  filtros: any = {},
) {
  let whereClause = '1=1';
  const params: any = {};

  if (filtros.idUsuario) {
    whereClause += ' AND idUsuario = @idUsuario';
    params.idUsuario = { valor: filtros.idUsuario, tipo: Int };
  }
  // Más filtros...

  return await ejecutarQuery<any>(
    `
        SELECT a.*, u.nombre as nombreUsuario, u.correo as correoUsuario
        FROM Inv_sis_auditoria a
        LEFT JOIN Inv_seg_usuarios u ON a.idUsuario = u.idUsuario
        WHERE ${whereClause}
        ORDER BY a.fecha DESC
        OFFSET ${Math.floor(offset)} ROWS FETCH NEXT ${Math.floor(limit)} ROWS ONLY
    `,
    params,
  );
}

export async function contarAuditLogs(filtros: any = {}) {
  // Simplificado
  const res = await ejecutarQuery<{ total: number }>(
    `SELECT COUNT(*) as total FROM Inv_sis_auditoria`,
  );
  return res[0].total;
}

export async function obtenerResumenActividad(dias: number) {
  // Mock o implementación simple
  return {
    totalAcciones: 0,
    accionesPorTipo: [],
    accionesPorUsuario: [],
    erroresTotales: 0,
  };
}
