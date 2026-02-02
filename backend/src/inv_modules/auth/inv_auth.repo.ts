import { Int, NVarChar, DateTime, ejecutarSP, crearRequest } from '../../db/base.repo';
import { InvUsuario } from '../inv_types';

/**
 * Autentica un usuario usando el procedimiento almacenado
 */
export async function login(
  correo: string,
  passwordHasheado: string,
): Promise<InvUsuario | null> {
  const result = await ejecutarSP<InvUsuario & { rolNombre: string }>(
    'Inv_sp_auth_login',
    {
      correo: { valor: correo, tipo: NVarChar },
      password: { valor: passwordHasheado, tipo: NVarChar },
    },
  );

  if (result.length === 0) return null;

  const row = result[0];
  const usuario: InvUsuario = { ...row };

  // Mapear rol si viene en el resultado
  if (row.idRol) {
    usuario.rol = {
      idRol: row.idRol,
      nombre: row.rolNombre || '',
      reglas: '[]', // Se asume que el backend maneja las reglas o se leen del rol
      activo: true,
    };
  }

  return usuario;
}

/**
 * Registra un nuevo Refresh Token
 */
export async function registrarRefreshToken(
  idUsuario: number,
  token: string,
  expira: Date,
): Promise<void> {
  await ejecutarSP('Inv_sp_auth_token_registrar', {
    idUsuario: { valor: idUsuario, tipo: Int },
    token: { valor: token, tipo: NVarChar },
    expira: { valor: expira, tipo: DateTime },
  });
}

/**
 * Valida un Refresh Token y retorna el ID de usuario
 */
export async function validarRefreshToken(
  token: string,
): Promise<number | null> {
  const result = await ejecutarSP<{ idUsuario: number }>(
    'Inv_sp_auth_token_validar',
    {
      token: { valor: token, tipo: NVarChar },
    },
  );

  return result.length > 0 ? result[0].idUsuario : null;
}

/**
 * Verifica permisos para un módulo y acción
 */
export async function verificarPermiso(
  idUsuario: number,
  modulo: string,
  accion: string,
): Promise<boolean> {
  const result = await ejecutarSP<{ tienePermiso: boolean }>(
    'Inv_sp_seg_permisos_verificar',
    {
      idUsuario: { valor: idUsuario, tipo: Int },
      modulo: { valor: modulo, tipo: NVarChar },
      accion: { valor: accion, tipo: NVarChar },
    },
  );

  return result.length > 0 ? result[0].tienePermiso : false;
}

// === GESTIÓN DE USUARIOS ===

export async function listarUsuarios() {
  const request = await crearRequest();
  // Consulta directa para evitar crear SP ahora
  const query = `
        SELECT 
            u.idUsuario,
            u.nombre,
            u.correo,
            u.carnet,
            u.activo,
            r.idRol,
            r.nombre as rolNombre,
            (
                SELECT TOP 1 CAST(ot.idOT AS VARCHAR) + ' - ' + ot.tipoOT 
                FROM Inv_ope_ot ot 
                WHERE ot.idTecnicoAsignado = u.idUsuario AND ot.estado = 'EN_PROGRESO'
            ) as laborActual,
            (
                SELECT COUNT(*) 
                FROM Inv_ope_ot ot 
                WHERE ot.idTecnicoAsignado = u.idUsuario AND ot.estado = 'FINALIZADA'
                AND ot.fechaCierre >= DATEADD(day, -30, GETDATE())
            ) as otsMes
        FROM Inv_seg_usuarios u
        LEFT JOIN Inv_seg_roles r ON u.idRol = r.idRol
        ORDER BY u.nombre
    `;
  const res = await request.query(query);
  return res.recordset;
}

export async function toggleEstadoUsuario(idUsuario: number, activo: boolean) {
  const request = await crearRequest();
  request.input('id', Int, idUsuario);
  request.input('activo', Int, activo ? 1 : 0);
  await request.query('UPDATE Inv_seg_usuarios SET activo = @activo WHERE idUsuario = @id');
}

export async function crearUsuario(data: any) {
  const request = await crearRequest();
  request.input('nombre', NVarChar, data.nombre);
  request.input('correo', NVarChar, data.correo);
  request.input('carnet', NVarChar, data.carnet);
  request.input('password', NVarChar, data.password); // Ya debe venir hasheado
  request.input('idRol', Int, data.idRol);

  // Simple insert
  const query = `
        INSERT INTO Inv_seg_usuarios (nombre, correo, carnet, password, idRol, activo)
        VALUES (@nombre, @correo, @carnet, @password, @idRol, 1)
    `;
  await request.query(query);
}
