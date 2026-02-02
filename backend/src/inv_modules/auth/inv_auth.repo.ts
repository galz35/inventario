import { Int, NVarChar, DateTime, ejecutarSP } from '../../db/base.repo';
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
