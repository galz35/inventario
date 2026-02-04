import {
  ejecutarQuery,
  Int,
  NVarChar
} from '../../db/base.repo';

/**
 * Búsqueda Inteligente de Activo por Serial
 * Busca coincidencia parcial o exacta en seriales.
 */
export async function buscarActivoPorSerie(serial: string) {
  // Busca coincidencia parcial o exacta
  // JOINs a productos, almacenes, tecnicos y clientes para dar contexto completo
  return await ejecutarQuery(`
        SELECT TOP 1
            a.idActivo,
            a.serial,
            a.estado,
            p.nombre as productoNombre,
            p.codigo as productoCodigo,
            alm.nombre as ubicacionAlmacen,
            u.nombre as tecnicoResponsable,
            c.nombre as clienteAsignado,
            a.fechaIngreso
        FROM Inv_act_activos a
        JOIN Inv_cat_productos p ON a.idProducto = p.idProducto
        LEFT JOIN Inv_cat_almacenes alm ON a.idAlmacenActual = alm.idAlmacen
        LEFT JOIN Inv_seg_usuarios u ON a.idTecnicoActual = u.idUsuario
        LEFT JOIN Inv_cat_clientes c ON a.idClienteActual = c.idCliente
        WHERE a.serial LIKE @serial
    `, { serial: { valor: `%${serial}%`, tipo: NVarChar } });
}

export async function listarActivos(filtros: {
  texto?: string;
  estado?: string;
  idAlmacen?: number;
} = {}) {
  let query = `
        SELECT 
            a.idActivo,
            a.serial,
            a.estado,
            a.modelo,
            p.nombre as productoNombre,
            p.codigo as productoCodigo,
            alm.nombre as ubicacionAlmacen,
            u.nombre as tecnicoResponsable,
            c.nombre as clienteAsignado,
            a.fechaIngreso
        FROM Inv_act_activos a
        JOIN Inv_cat_productos p ON a.idProducto = p.idProducto
        LEFT JOIN Inv_cat_almacenes alm ON a.idAlmacenActual = alm.idAlmacen
        LEFT JOIN Inv_seg_usuarios u ON a.idTecnicoActual = u.idUsuario
        LEFT JOIN Inv_cat_clientes c ON a.idClienteActual = c.idCliente
        WHERE 1=1
    `;

  const params: any = {};

  if (filtros.texto) {
    query += ` AND (a.serial LIKE @texto OR p.nombre LIKE @texto OR p.codigo LIKE @texto)`;
    params.texto = { valor: `%${filtros.texto}%`, tipo: NVarChar };
  }

  if (filtros.estado) {
    query += ` AND a.estado = @estado`;
    params.estado = { valor: filtros.estado, tipo: NVarChar };
  }

  if (filtros.idAlmacen) {
    query += ` AND a.idAlmacenActual = @idAlmacen`;
    params.idAlmacen = { valor: filtros.idAlmacen, tipo: Int };
  }

  query += ` ORDER BY a.fechaIngreso DESC`;

  // Limitamos a 200 resultados para no sobrecargar si no hay filtros estrictos
  query = query.replace('SELECT', 'SELECT TOP 200');

  return await ejecutarQuery(query, params);
}
