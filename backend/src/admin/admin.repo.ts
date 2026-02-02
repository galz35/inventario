/**
 * Admin Repository - Queries para el módulo Administrativo
 * Unificado con prefijos Inv_ según estándar del proyecto.
 */
import {
  crearRequest,
  ejecutarQuery,
  Int,
  NVarChar,
  Bit,
  DateTime,
  SqlDate,
} from '../db/base.repo';
import {
  UsuarioDb,
  RolDb,
  UsuarioConfigDb,
  SeguridadPerfilDb,
  OrganizacionNodoDb,
  LogSistemaDb,
  AuditLogDb,
  ResultadoPaginado,
} from '../db/tipos';

// ==========================================
// SEGURIDAD Y USUARIOS (Access Info)
// ==========================================

export async function obtenerUsuariosAccessInfo() {
  return await ejecutarQuery<
    UsuarioDb & { subordinateCount: number; menuPersonalizado: string | null }
  >(`
        SELECT 
            u.idUsuario, u.nombre, u.correo, u.carnet, u.activo,
            ISNULL(sc.subordinateCount, 0) AS subordinateCount,
            c.menuPersonalizado
        FROM Inv_seg_usuarios u
        LEFT JOIN Inv_seg_usuarios_config c 
            ON u.idUsuario = c.idUsuario
        LEFT JOIN (
            SELECT jefeCarnet, COUNT(*) AS subordinateCount
            FROM Inv_seg_usuarios
            WHERE activo = 1
            GROUP BY jefeCarnet
        ) sc 
            ON sc.jefeCarnet = u.carnet
        WHERE u.activo = 1
        ORDER BY u.nombre ASC
    `);
}

export async function asignarMenuPersonalizado(
  idUsuario: number,
  menuJson: string | null,
) {
  // Upsert config
  const config = await ejecutarQuery<UsuarioConfigDb>(
    `
        SELECT * FROM Inv_seg_usuarios_config WHERE idUsuario = @id
    `,
    { id: { valor: idUsuario, tipo: Int } },
  );

  if (config.length > 0) {
    await ejecutarQuery(
      `
            UPDATE Inv_seg_usuarios_config SET menuPersonalizado = @menu WHERE idUsuario = @id
        `,
      {
        menu: { valor: menuJson, tipo: NVarChar },
        id: { valor: idUsuario, tipo: Int },
      },
    );
  } else {
    await ejecutarQuery(
      `
            INSERT INTO Inv_seg_usuarios_config (idUsuario, menuPersonalizado) VALUES (@id, @menu)
        `,
      {
        id: { valor: idUsuario, tipo: Int },
        menu: { valor: menuJson, tipo: NVarChar },
      },
    );
  }
}

// ==========================================
// ADMIN GENERAL (Usuarios, Roles, Logs)
// ==========================================

export async function listarUsuarios(pagina: number = 1, limite: number = 50) {
  const offset = (pagina - 1) * limite;

  const datos = await ejecutarQuery<
    UsuarioDb & { rolNombre: string; menuPersonalizado: string | null }
  >(
    `
        SELECT u.idUsuario, u.nombre, u.correo, u.carnet, u.activo, u.idRol, r.nombre as rolNombre, c.menuPersonalizado
        FROM Inv_seg_usuarios u
        LEFT JOIN Inv_seg_roles r ON u.idRol = r.idRol
        LEFT JOIN Inv_seg_usuarios_config c ON u.idUsuario = c.idUsuario
        ORDER BY u.nombre ASC
        OFFSET @offset ROWS FETCH NEXT @limite ROWS ONLY
    `,
    {
      offset: { valor: offset, tipo: Int },
      limite: { valor: limite, tipo: Int },
    },
  );

  const totalRes = await ejecutarQuery<{ total: number }>(
    `SELECT COUNT(*) as total FROM Inv_seg_usuarios`,
  );
  const total = totalRes[0].total;

  return {
    datos,
    total,
    pagina,
    porPagina: limite,
    totalPaginas: Math.ceil(total / limite),
  };
}

export async function cambiarRolUsuario(
  idUsuario: number,
  rolGlobal: string,
  idRol?: number,
) {
  await ejecutarQuery(
    `
        UPDATE Inv_seg_usuarios 
        SET idRol = @idRol, ultimoAcceso = GETDATE()
        WHERE idUsuario = @idUsuario
    `,
    {
      idUsuario: { valor: idUsuario, tipo: Int },
      idRol: { valor: idRol || null, tipo: Int },
    },
  );
}

export async function obtenerEstadisticasAdmin() {
  const stats = await ejecutarQuery<{
    total: number;
    activos: number;
    inactivos: number;
  }>(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN activo = 1 THEN 1 ELSE 0 END) as activos,
            SUM(CASE WHEN activo = 0 THEN 1 ELSE 0 END) as inactivos
        FROM Inv_seg_usuarios
    `);
  return stats[0] || { total: 0, activos: 0, inactivos: 0 };
}

// Roles
export async function listarRoles() {
  return await ejecutarQuery<RolDb>(
    `SELECT * FROM Inv_seg_roles ORDER BY nombre ASC`,
  );
}

export async function crearRol(rol: Partial<RolDb>) {
  await ejecutarQuery(
    `
        INSERT INTO Inv_seg_roles (nombre, descripcion, reglas, esSistema, defaultMenu)
        VALUES (@nombre, @descripcion, @reglas, @esSistema, @defaultMenu)
    `,
    {
      nombre: { valor: rol.nombre, tipo: NVarChar },
      descripcion: { valor: rol.descripcion, tipo: NVarChar },
      reglas: { valor: rol.reglas || '[]', tipo: NVarChar },
      esSistema: { valor: rol.esSistema || false, tipo: Bit },
      defaultMenu: { valor: rol.defaultMenu, tipo: NVarChar },
    },
  );
}

export async function actualizarRol(idRol: number, rol: Partial<RolDb>) {
  await ejecutarQuery(
    `
        UPDATE Inv_seg_roles 
        SET nombre = @nombre, descripcion = @descripcion, reglas = @reglas
        WHERE idRol = @idRol
    `,
    {
      idRol: { valor: idRol, tipo: Int },
      nombre: { valor: rol.nombre, tipo: NVarChar },
      descripcion: { valor: rol.descripcion, tipo: NVarChar },
      reglas: { valor: rol.reglas, tipo: NVarChar },
    },
  );
}

export async function eliminarRol(idRol: number) {
  await ejecutarQuery(`DELETE FROM Inv_seg_roles WHERE idRol = @idRol`, {
    idRol: { valor: idRol, tipo: Int },
  });
}

// Logs
export async function crearLog(log: Partial<LogSistemaDb>) {
  await ejecutarQuery(
    `
        INSERT INTO Inv_sis_logs (idUsuario, accion, entidad, datos, fecha)
        VALUES (@idUsuario, @accion, @entidad, @datos, GETDATE())
    `,
    {
      idUsuario: { valor: log.idUsuario, tipo: Int },
      accion: { valor: log.accion, tipo: NVarChar },
      entidad: { valor: log.entidad, tipo: NVarChar },
      datos: { valor: log.datos, tipo: NVarChar },
    },
  );
}

export async function listarLogs(pagina: number = 1, limite: number = 50) {
  const offset = (pagina - 1) * limite;
  const datos = await ejecutarQuery<LogSistemaDb>(
    `
        SELECT * FROM Inv_sis_logs ORDER BY fecha DESC
        OFFSET @offset ROWS FETCH NEXT @limite ROWS ONLY
    `,
    {
      offset: { valor: offset, tipo: Int },
      limite: { valor: limite, tipo: Int },
    },
  );

  const totalRes = await ejecutarQuery<{ total: number }>(
    'SELECT COUNT(*) as total FROM Inv_sis_logs',
  );
  return { datos, total: totalRes[0].total, pagina, porPagina: limite };
}

// Auditoría
export async function listarAuditLogs(filtro: {
  page?: number;
  limit?: number;
  idUsuario?: number;
  accion?: string;
  query?: string;
}) {
  const pagina = filtro.page || 1;
  const limite = filtro.limit || 50;
  const offset = (pagina - 1) * limite;

  let whereClause = '1=1';
  const params: any = {
    offset: { valor: offset, tipo: Int },
    limite: { valor: limite, tipo: Int },
  };

  if (filtro.idUsuario) {
    whereClause += ' AND idUsuario = @idUsuario';
    params.idUsuario = { valor: filtro.idUsuario, tipo: Int };
  }
  if (filtro.accion) {
    whereClause += ' AND accion = @accion';
    params.accion = { valor: filtro.accion, tipo: NVarChar };
  }
  if (filtro.query) {
    whereClause +=
      ' AND (datos LIKE @query OR accion LIKE @query OR entidad LIKE @query)';
    params.query = { valor: `%${filtro.query}%`, tipo: NVarChar };
  }

  const countQuery = `SELECT COUNT(*) as total FROM Inv_sis_logs WHERE ${whereClause}`;
  const dataQuery = `
        SELECT l.*, u.nombre as nombreUsuario 
        FROM Inv_sis_logs l
        LEFT JOIN Inv_seg_usuarios u ON l.idUsuario = u.idUsuario
        WHERE ${whereClause}
        ORDER BY l.fecha DESC
        OFFSET @offset ROWS FETCH NEXT @limite ROWS ONLY
    `;

  const totalRes = await ejecutarQuery<{ total: number }>(countQuery, params);
  const datos = await ejecutarQuery<any>(dataQuery, params);

  return {
    items: datos.map((d: any) => ({
      idAuditLog: d.idLog,
      accion: d.accion,
      entidad: d.entidad,
      datosNuevos: d.datos,
      idUsuario: d.idUsuario,
      nombreUsuario: d.nombreUsuario,
      fecha: d.fecha,
    })),
    total: totalRes[0].total,
    page: pagina,
    totalPages: Math.ceil(totalRes[0].total / limite),
  };
}

// Perfiles de Seguridad (Placeholder)
export async function obtenerPerfilesSeguridad() {
  // Retorna lista vac�a por ahora
  return [];
}

// Organigrama (Placeholder)
export async function obtenerOrganigrama() {
  try {
    return await ejecutarQuery('SELECT * FROM p_organizacion_nodos');
  } catch (e) {
    return [];
  }
}

export async function crearNodoOrganigrama(nodo: any) {
  // Placeholder logic
  return { id: 0, nombre: nodo.nombre };
}

export async function asignarUsuarioNodo(
  idUsuario: number,
  idNodo: number,
  rol: string,
) {
  // Placeholder logic
  return true;
}
