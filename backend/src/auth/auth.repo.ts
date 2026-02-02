/**
 * Auth Repository - Queries de autenticación usando MSSQL directo
 * Adaptado para esquema Inv_ (Inventario)
 */
import { crearRequest, NVarChar, Int } from '../db/base.repo';
import { UsuarioDb, CredencialesDb, RolDb } from '../db/tipos';

/**
 * Obtiene un usuario por correo o carnet (activo)
 */
export async function obtenerUsuarioPorIdentificador(
  identificador: string,
): Promise<(UsuarioDb & { rol?: RolDb }) | null> {
  const request = await crearRequest();
  request.input('identificador', NVarChar, identificador);

  // Nota: Inv_seg_usuarios tiene el password directamente.
  // Mapeamos las columnas a lo que espera la app (UsuarioDb)
  const result = await request.query<
    UsuarioDb & {
      rolNombre?: string;
      rolDescripcion?: string;
      esSistema?: boolean;
      reglas?: string;
    }
  >(`
        SELECT 
            u.idUsuario,
            u.nombre,
            u.correo,
            u.carnet,
            u.activo,
            u.idRol,
            u.idAlmacenTecnico,
            r.nombre as rolNombre,
            r.descripcion as rolDescripcion,
            r.esSistema,
            r.reglas
        FROM Inv_seg_usuarios u
        LEFT JOIN Inv_seg_roles r ON u.idRol = r.idRol
        WHERE (u.correo = @identificador OR u.carnet = @identificador)
          AND u.activo = 1
    `);

  if (result.recordset.length === 0) return null;

  const row = result.recordset[0];

  // Mapear rol si existe
  const usuario: UsuarioDb & { rol?: RolDb } = { ...row };
  if (row.idRol) {
    usuario.rol = {
      idRol: row.idRol,
      nombre: row.rolNombre || '',
      descripcion: row.rolDescripcion || null,
      esSistema: row.esSistema || false,
      reglas: row.reglas || '[]',
      defaultMenu: null,
    };
    // Asignar rolGlobal para compatibilidad con JWT strategy
    usuario.rolGlobal = row.rolNombre || 'Empleado';
  } else {
    usuario.rolGlobal = 'Empleado';
  }

  return usuario;
}

/**
 * Obtiene credenciales por idUsuario
 * En este esquema, las credenciales (password) están en la misma tabla Inv_seg_usuarios
 */
export async function obtenerCredenciales(
  idUsuario: number,
): Promise<CredencialesDb | null> {
  const request = await crearRequest();
  request.input('idUsuario', Int, idUsuario);

  try {
    // Intento 1: Query completa
    const result = await request.query<CredencialesDb>(`
            SELECT idUsuario, password as passwordHash, refreshToken as refreshTokenHash, ultimoAcceso as ultimoLogin 
            FROM Inv_seg_usuarios 
            WHERE idUsuario = @idUsuario
        `);
    return result.recordset[0] || null;
  } catch (e: any) {
    // Si falla por columna inválida, fallback y auto-reparar
    if (e.message?.includes('Invalid column name')) {
      console.warn(
        'Detectada falta de columna refreshToken. Usando fallback y reparando...',
      );

      // 1. Obtener data básica
      const result = await request.query<CredencialesDb>(`
                SELECT idUsuario, password as passwordHash, NULL as refreshTokenHash, ultimoAcceso as ultimoLogin 
                FROM Inv_seg_usuarios 
                WHERE idUsuario = @idUsuario
             `);

      // 2. Intentar reparar schema async (sin await para no bloquear login)
      crearRequest().then((req) =>
        req
          .query(
            `ALTER TABLE Inv_seg_usuarios ADD refreshToken NVARCHAR(MAX) NULL`,
          )
          .catch(() => {}),
      );

      return result.recordset[0] || null;
    }
    console.error('Error crítico obteniendo credenciales', e);
    return null;
  }
}

/**
 * Actualiza el último login
 */
export async function actualizarUltimoLogin(idUsuario: number): Promise<void> {
  const request = await crearRequest();
  request.input('idUsuario', Int, idUsuario);

  await request.query(`
        UPDATE Inv_seg_usuarios 
        SET ultimoAcceso = GETDATE() 
        WHERE idUsuario = @idUsuario
    `);
}

/**
 * Actualiza el refresh token hash
 */
export async function actualizarRefreshToken(
  idUsuario: number,
  refreshTokenHash: string,
): Promise<void> {
  const request = await crearRequest();
  request.input('idUsuario', Int, idUsuario);
  request.input('refreshTokenHash', NVarChar, refreshTokenHash);

  // Validamos si existe la columna antes de intentar update para evitar crash
  // O simplemente intentamos un ALTER previo si falla?
  // Por ahora intentaremos el UPDATE asumiendo que se corrió el fix de DB.
  try {
    await request.query(`
            UPDATE Inv_seg_usuarios 
            SET refreshToken = @refreshTokenHash 
            WHERE idUsuario = @idUsuario
        `);
  } catch (e: any) {
    if (e.message?.includes('Invalid column name')) {
      // Quick Fix: Add column if missing
      await request.query(
        `ALTER TABLE Inv_seg_usuarios ADD refreshToken NVARCHAR(MAX) NULL`,
      );
      // Retry update
      await request.query(`
                UPDATE Inv_seg_usuarios 
                SET refreshToken = @refreshTokenHash 
                WHERE idUsuario = @idUsuario
            `);
    } else {
      throw e;
    }
  }
}

/**
 * Cuenta subordinados (No implementado en fase 1 con jefeCarnet directo en tabla, usar jerarquía si existe)
 * Revisando esquema, no hay jefeCarnet en Inv_seg_usuarios fase 1. Devolvemos 0.
 */
export async function contarSubordinados(carnetJefe: string): Promise<number> {
  return 0;
}

/**
 * Obtiene usuario por ID
 */
export async function obtenerUsuarioPorId(
  idUsuario: number,
): Promise<(UsuarioDb & { rol?: RolDb }) | null> {
  const request = await crearRequest();
  request.input('idUsuario', Int, idUsuario);

  const result = await request.query<
    UsuarioDb & {
      rolNombre?: string;
      rolDescripcion?: string;
      esSistema?: boolean;
      reglas?: string;
    }
  >(`
        SELECT 
            u.idUsuario,
            u.nombre,
            u.correo,
            u.carnet,
            u.activo,
            u.idRol,
            u.idAlmacenTecnico,
            r.nombre as rolNombre,
            r.descripcion as rolDescripcion,
            r.esSistema,
            r.reglas
        FROM Inv_seg_usuarios u
        LEFT JOIN Inv_seg_roles r ON u.idRol = r.idRol
        WHERE u.idUsuario = @idUsuario
    `);

  if (result.recordset.length === 0) return null;

  const row = result.recordset[0];
  const usuario: UsuarioDb & { rol?: RolDb } = { ...row };

  if (row.idRol) {
    usuario.rol = {
      idRol: row.idRol,
      nombre: row.rolNombre || '',
      descripcion: row.rolDescripcion || null,
      esSistema: row.esSistema || false,
      reglas: row.reglas || '[]',
      defaultMenu: null,
    };
  }

  return usuario;
}

/**
 * Obtiene config de usuario (Fase 1 no tiene tabla Config, retornar null)
 */
export async function obtenerConfigUsuario(
  idUsuario: number,
): Promise<{ customMenu?: string } | null> {
  return null;
}
