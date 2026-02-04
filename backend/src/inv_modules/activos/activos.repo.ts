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

export async function asignarActivo(datos: {
  idActivo: number;
  idTecnico?: number;
  idAlmacen?: number;
  idUsuarioAsigna: number;
  notas?: string;
}) {
  return await ejecutarQuery(`
      UPDATE Inv_act_activos
      SET 
          idTecnicoActual = @idTecnico,
          idAlmacenActual = @idAlmacen,
          idClienteActual = NULL, -- Reset cliente al reasignar
          fechaUltimoMovimiento = GETDATE()
      WHERE idActivo = @idActivo;

      -- Registrar Histórico
      INSERT INTO Inv_act_historial (idActivo, tipoMovimiento, idUbicacionNueva, idResponsableNuevo, fechaMovimiento, idUsuarioRegistra, notas)
      VALUES (@idActivo, 'ASIGNACION', @idAlmacen, @idTecnico, GETDATE(), @idUsuarioAsigna, @notas);
  `, {
    idActivo: { valor: datos.idActivo, tipo: Int },
    idTecnico: { valor: datos.idTecnico || null, tipo: Int },
    idAlmacen: { valor: datos.idAlmacen || null, tipo: Int },
    idUsuarioAsigna: { valor: datos.idUsuarioAsigna, tipo: Int },
    notas: { valor: datos.notas || 'Reasignación', tipo: NVarChar }
  });
}

export async function crearActivo(datos: {
  serial: string;
  idProducto: number;
  estado: string;
  idAlmacenActual?: number;
  modelo?: string;
  idUsuarioRegistra: number;
}) {
  // Verificar duplicado
  const existe = await ejecutarQuery('SELECT 1 FROM Inv_act_activos WHERE serial = @serial', {
    serial: { valor: datos.serial, tipo: NVarChar }
  });
  if (existe.length > 0) throw new Error(`El serial ${datos.serial} ya existe.`);

  return await ejecutarQuery(`
        INSERT INTO Inv_act_activos (serial, idProducto, estado, idAlmacenActual, modelo, fechaIngreso)
        VALUES (@serial, @idProducto, @estado, @idAlmacenActual, @modelo, GETDATE());

        DECLARE @idActivo INT = SCOPE_IDENTITY();

        INSERT INTO Inv_act_historial (idActivo, tipoMovimiento, idUbicacionNueva, fechaMovimiento, idUsuarioRegistra, notas)
        VALUES (@idActivo, 'ALTA', @idAlmacenActual, GETDATE(), @idUsuarioRegistra, 'Alta Inicial');

        SELECT @idActivo as id;
    `, {
    serial: { valor: datos.serial, tipo: NVarChar },
    idProducto: { valor: datos.idProducto, tipo: Int },
    estado: { valor: datos.estado, tipo: NVarChar },
    idAlmacenActual: { valor: datos.idAlmacenActual || 1, tipo: Int }, // Default Bodega Central
    modelo: { valor: datos.modelo || '', tipo: NVarChar },
    idUsuarioRegistra: { valor: datos.idUsuarioRegistra, tipo: Int }
  });
}
