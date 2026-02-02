import { ejecutarSP, Int, NVarChar, ejecutarQuery } from '../../db/base.repo';

export interface InvActivo {
  idActivo?: number;
  serial: string;
  idProducto: number;
  estado: string;
  idAlmacenActual?: number;
  idTecnicoActual?: number;
  idClienteActual?: number;
}

/**
 * Crea un nuevo activo (Alta de Activo)
 */
export async function crearActivo(dto: {
  serial: string;
  idProducto: number;
  idAlmacen?: number;
  estado?: string;
}) {
  return await ejecutarSP('Inv_sp_activo_crear', {
    serial: { valor: dto.serial, tipo: NVarChar },
    idProducto: { valor: dto.idProducto, tipo: Int },
    idAlmacen: { valor: dto.idAlmacen || null, tipo: Int },
    estado: { valor: dto.estado || 'ALMACEN', tipo: NVarChar },
  });
}

/**
 * Obtiene lista de activos con filtros
 */
export async function listarActivos(filtros: {
  estado?: string;
  idAlmacen?: number;
  idTecnico?: number;
  buscar?: string;
}) {
  // Implementar SP Inv_sp_activos_listar si es necesario, por ahora logic base
  return await ejecutarSP<InvActivo & { productoNombre: string }>(
    'Inv_sp_activos_listar',
    {
      estado: { valor: filtros.estado || null, tipo: NVarChar },
      idAlmacen: { valor: filtros.idAlmacen || null, tipo: Int },
      idTecnico: { valor: filtros.idTecnico || null, tipo: Int },
      buscar: { valor: filtros.buscar || null, tipo: NVarChar },
    },
  );
}

/**
 * Asigna un activo a un técnico
 */
export async function asignarActivoATecnico(
  idActivo: number,
  idTecnico: number,
  idUsuarioResponsable: number,
  notas?: string,
) {
  await ejecutarSP('Inv_sp_activo_asignar_tecnico', {
    idActivo: { valor: idActivo, tipo: Int },
    idTecnico: { valor: idTecnico, tipo: Int },
    idUsuarioResponsable: { valor: idUsuarioResponsable, tipo: Int },
    notas: { valor: notas || null, tipo: NVarChar },
  });
}

/**
 * Registra la instalación de un activo en un cliente (desde una OT)
 */
export async function instalarActivoEnCliente(
  idActivo: number,
  idCliente: number,
  idOT: number,
  idUsuarioResponsable: number,
) {
  // Este requeriría un SP más complejo que actualice estado a 'INSTALADO'
  // y vincule con la OT.
  await ejecutarSP('Inv_sp_activo_instalar', {
    idActivo: { valor: idActivo, tipo: Int },
    idCliente: { valor: idCliente, tipo: Int },
    idOT: { valor: idOT, tipo: Int },
    idUsuarioResponsable: { valor: idUsuarioResponsable, tipo: Int },
  });
}

/**
 * Envía un activo a reparación
 */
export async function enviarAReparacion(
  idActivo: number,
  diagnostico: string,
  idUsuario: number,
) {
  await ejecutarSP('Inv_sp_activo_enviar_reparacion', {
    idActivo: { valor: idActivo, tipo: Int },
    diagnostico: { valor: diagnostico, tipo: NVarChar },
    idUsuario: { valor: idUsuario, tipo: Int },
  });
}

/**
 * Registra el retorno de un activo desde reparación
 */
export async function recibirReparacion(dto: {
  idActivo: number;
  idReparacion: number;
  resultado: string;
  costo: number;
  idUsuario: number;
}) {
  await ejecutarSP('Inv_sp_activo_recibir_reparacion', {
    idActivo: { valor: dto.idActivo, tipo: Int },
    idReparacion: { valor: dto.idReparacion, tipo: Int },
    resultado: { valor: dto.resultado, tipo: NVarChar },
    costo: { valor: dto.costo, tipo: Int },
    idUsuario: { valor: dto.idUsuario, tipo: Int },
  });
}

/**
 * Devuelve un activo a un almacén (eg. de técnico a bodega central)
 */
export async function devolverActivo(
  idActivo: number,
  idAlmacenDestino: number,
  idUsuario: number,
  notas?: string,
) {
  await ejecutarSP('Inv_sp_activo_devolver', {
    idActivo: { valor: idActivo, tipo: Int },
    idAlmacenDestino: { valor: idAlmacenDestino, tipo: Int },
    idUsuario: { valor: idUsuario, tipo: Int },
    notas: { valor: notas || null, tipo: NVarChar },
  });
}

/**
 * Realiza el reemplazo de un activo dañado por uno nuevo en una OT
 */
export async function reemplazarActivoOT(dto: {
  idOT: number;
  idActivoSaliente: number;
  idActivoEntrante: number;
  idUsuario: number;
  motivo?: string;
}) {
  await ejecutarSP('Inv_sp_ot_activo_reemplazar', {
    idOT: { valor: dto.idOT, tipo: Int },
    idActivoSaliente: { valor: dto.idActivoSaliente, tipo: Int },
    idActivoEntrante: { valor: dto.idActivoEntrante, tipo: Int },
    idUsuario: { valor: dto.idUsuario, tipo: Int },
    motivo: { valor: dto.motivo || null, tipo: NVarChar },
  });
}
/**
 * Obtiene el historial completo de movimientos de un activo
 */
export async function obtenerHistorialActivo(idActivo: number) {
  return await ejecutarSP('Inv_sp_activo_historial_obtener', {
    idActivo: { valor: idActivo, tipo: Int },
  });
}

/**
 * Deshabilita (apasiva) un activo
 */
export async function eliminarActivo(idActivo: number) {
  return await ejecutarQuery(
    `
        UPDATE Inv_activos SET estado = 'BAJA' WHERE idActivo = @id
    `,
    [{ name: 'id', type: Int, value: idActivo }],
  );
}
