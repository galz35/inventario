import { ejecutarSP, Int, NVarChar, ejecutarQuery } from '../../db/base.repo';

export async function iniciarConteo(
  almacenId: number,
  idUsuario: number,
  notas?: string,
) {
  const res = await ejecutarSP<{ idConteo: number }>('Inv_sp_conteo_iniciar', {
    almacenId: { valor: almacenId, tipo: Int },
    idUsuario: { valor: idUsuario, tipo: Int },
    notas: { valor: notas || null, tipo: NVarChar },
  });
  return res[0]?.idConteo;
}

export async function registrarItemConteo(
  idConteo: number,
  productoId: number,
  stockFisico: number,
) {
  await ejecutarSP('Inv_sp_conteo_registrar_item', {
    idConteo: { valor: idConteo, tipo: Int },
    productoId: { valor: productoId, tipo: Int },
    stockFisico: { valor: stockFisico, tipo: Int },
  });
}

export async function finalizarConteo(idConteo: number, idUsuario: number) {
  return await ejecutarSP('Inv_sp_conteo_finalizar', {
    idConteo: { valor: idConteo, tipo: Int },
    idUsuario: { valor: idUsuario, tipo: Int },
  });
}

export async function listarConteos() {
  // Basic query to list counts
  return await ejecutarQuery(`
        SELECT c.idConteo, a.nombre as almacenNombre, c.fechaInicio, c.fechaFin, c.estado, u.nombre as responsableNombre
        FROM Inv_audit_conteos c
        JOIN Inv_cat_almacenes a ON c.almacenId = a.idAlmacen
        LEFT JOIN Inv_seg_usuarios u ON c.idResponsable = u.idUsuario
        ORDER BY c.fechaInicio DESC
    `);
}
