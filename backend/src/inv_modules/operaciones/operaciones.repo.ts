import {
  Int,
  DateTime,
  Decimal,
  ejecutarSP,
  NVarChar,
  conTransaccion,
  crearRequest,
  ejecutarQuery
} from '../../db/base.repo';

// ... (existing code for crearOT and listarOTs kept if not replaced, but we are replacing listarOTsQuery)

export async function listarOTsQuery(idTecnico?: number, idCliente?: number) {
  const request = await crearRequest();
  let query = `
        SELECT 
            ot.idOT,
            ot.idProyecto,
            p.nombre as proyectoNombre,
            ot.idTecnicoAsignado,
            u.nombre as tecnicoNombre,
            ot.clienteNombre,
            ot.clienteDireccion,
            ot.tipoOT,
            ot.prioridad,
            ot.estado,
            ot.fechaAsignacion,
            ot.fechaCreacion,
            ot.fechaCierre,
            ot.notas,
            ot.numeroCliente,
            ot.contactoNombre,
            ot.telefono,
            ot.correo,
            ot.descripcionTrabajo
        FROM Inv_ope_ot ot
        LEFT JOIN Inv_ope_proyectos p ON ot.idProyecto = p.idProyecto
        LEFT JOIN Inv_seg_usuarios u ON ot.idTecnicoAsignado = u.idUsuario
        WHERE 1=1
    `;

  if (idTecnico) {
    request.input('idTecnico', Int, idTecnico);
    query += ` AND ot.idTecnicoAsignado = @idTecnico`;
  }

  if (idCliente) {
    request.input('idCliente', Int, idCliente);
    // Asumiendo que hay una columna idCliente o se filtra por nombre?
    // Revisando el esquema: la tabla Inv_ope_ot tiene idCliente?
    // No lo vi en el CREATE TABLE de arriba, solo clienteNombre.
    // Pero crearOT recibe idCliente.
    // Voy a asumir que existe idCliente (INT) en la tabla real o voy a filtrar por clienteNombre si no.
    // Pero para ser seguro, usaré "ot.idCliente = @idCliente" si existe la columna, 
    // OJO: En el repo 'crearOT' usa 'idCliente', así que la columna DEBE existir.
    query += ` AND ot.idCliente = @idCliente`;
  }

  query += ` ORDER BY ot.fechaCreacion DESC`;

  const res = await request.query(query);
  return res.recordset;
}

export async function crearOT(dto: {
  idProyecto?: number;
  idCliente?: number;
  idTipoOT: number;
  prioridad: string;
  direccion: string;
  idUsuarioCrea: number;
  idTecnicoAsignado?: number;
  estado?: string;
  notas?: string;
  numeroCliente?: string;
  contactoNombre?: string;
  telefono?: string;
  correo?: string;
  descripcionTrabajo?: string;
  clienteNombre?: string;
}) {
  const res = await ejecutarSP<{ idOT: number }>('Inv_sp_ot_crear', {
    idProyecto: { valor: dto.idProyecto || null, tipo: Int },
    idCliente: { valor: dto.idCliente || null, tipo: Int },
    idTipoOT: { valor: dto.idTipoOT, tipo: Int },
    prioridad: { valor: dto.prioridad, tipo: NVarChar },
    direccion: { valor: dto.direccion, tipo: NVarChar },
    idUsuarioCrea: { valor: dto.idUsuarioCrea, tipo: Int },
    notas: { valor: dto.notas || null, tipo: NVarChar },
    numeroCliente: { valor: dto.numeroCliente || null, tipo: NVarChar },
    contactoNombre: { valor: dto.contactoNombre || null, tipo: NVarChar },
    telefono: { valor: dto.telefono || null, tipo: NVarChar },
    correo: { valor: dto.correo || null, tipo: NVarChar },
    descripcionTrabajo: { valor: dto.descripcionTrabajo || null, tipo: NVarChar },
    clienteNombre: { valor: dto.clienteNombre || null, tipo: NVarChar },
  });

  const idOT = res[0]?.idOT;

  if (idOT && (dto.idTecnicoAsignado || dto.estado)) {
    const request = await crearRequest();
    request.input('idOT', Int, idOT);
    let updateQuery = `UPDATE Inv_ope_ot SET idOT = idOT`;
    if (dto.idTecnicoAsignado) {
      request.input('idTec', Int, dto.idTecnicoAsignado);
      updateQuery += `, idTecnicoAsignado = @idTec, fechaAsignacion = GETDATE(), estado = 'EN_PROGRESO'`;
    }
    if (dto.estado && !dto.idTecnicoAsignado) {
      request.input('est', NVarChar, dto.estado);
      updateQuery += `, estado = @est`;
    }
    updateQuery += ` WHERE idOT = @idOT`;
    await request.query(updateQuery);
  }

  // 3. Log History
  await logOTHistory(idOT, 'CREACION', 'REGISTRADA', 'Creación inicial', dto.idUsuarioCrea);
  if (dto.idTecnicoAsignado) {
    await logOTHistory(idOT, 'ASIGNACION', 'EN_PROGRESO', `Asignado a técnico ${dto.idTecnicoAsignado}`, dto.idUsuarioCrea);
  }

  return res[0];
}

export async function listarOTs(filtros: {
  idTecnico?: number;
  estado?: string;
  fechaInicio?: Date;
  fechaFin?: Date;
}) {
  const params = {
    idTecnico: { valor: filtros.idTecnico || null, tipo: Int },
    estado: { valor: filtros.estado || null, tipo: NVarChar },
    fechaInicio: { valor: filtros.fechaInicio || null, tipo: DateTime },
  };

  try {
    // 1. INTENTO POR PROCEDIMIENTO ALMACENADO (RECOMENDADO)
    return await ejecutarSP('Inv_sp_ot_listar_filtro', params);
  } catch (error) {
    // 2. FALLBACK: CONSULTA INLINE (SEGURIDAD PARA PRESENTACIÓN)
    console.warn('⚠️ SP Inv_sp_ot_listar_filtro no encontrado o falló. Usando Query de respaldo.');
    const query = `
        SELECT 
            ot.*, 
            p.nombre as proyectoNombre, 
            u.nombre as tecnicoNombre
        FROM Inv_ope_ot ot
        LEFT JOIN Inv_ope_proyectos p ON ot.idProyecto = p.idProyecto
        LEFT JOIN Inv_seg_usuarios u ON ot.idTecnicoAsignado = u.idUsuario
        WHERE (@idTecnico IS NULL OR ot.idTecnicoAsignado = @idTecnico)
          AND (@estado IS NULL OR ot.estado = @estado)
          AND (@fechaInicio IS NULL OR ot.fechaCreacion >= @fechaInicio)
        ORDER BY ot.fechaCreacion DESC
    `;
    return await ejecutarQuery(query, {
      idTecnico: params.idTecnico,
      estado: params.estado,
      fechaInicio: params.fechaInicio,
    });
  }
}

export async function cerrarOT(
  idOT: number,
  idUsuario: number,
  notas?: string,
) {
  return await ejecutarSP('Inv_sp_ot_cerrar', {
    idOT: { valor: idOT, tipo: Int },
    idUsuarioCierra: { valor: idUsuario, tipo: Int },
    notas: { valor: notas || null, tipo: NVarChar },
  });
}

export async function validarStockDisponible(almacenId: number, productoId: number, cantidadRequerida: number) {
  const res = await ejecutarQuery(`
      SELECT cantidad FROM Inv_inv_stock 
      WHERE almacenId = @alm AND productoId = @prod
  `, {
    alm: { valor: almacenId, tipo: Int },
    prod: { valor: productoId, tipo: Int }
  });

  const disponible = res[0]?.cantidad || 0;
  if (disponible < cantidadRequerida) {
    throw new Error(`Stock insuficiente. Disponible: ${disponible}, Requerido: ${cantidadRequerida}`);
  }
}

export async function registrarConsumoOT(
  idOT: number,
  item: {
    productoId: number;
    cantidad: number;
    idUsuario: number;
  },
) {
  // 1. Obtener Almacén Técnico del usuario (Asumiendo que el usuario es un técnico con almacén asignado)
  // OJO: En un sistema ideal, el almacénID vendría del usuario. 
  // Por simplicidad para la demo, buscaremos el almacén tipo 'TECNICO' asociado al usuario,
  // O usaremos un parámetro, pero aquí lo buscaremos dinámicamente.

  const usuarioRes = await ejecutarQuery(`SELECT idAlmacenTecnico FROM Inv_seg_usuarios WHERE idUsuario = @u`, { u: { valor: item.idUsuario, tipo: Int } });
  const almacenOrigenId = usuarioRes[0]?.idAlmacenTecnico;

  if (almacenOrigenId) {
    // 2. Validar Stock antes de iniciar transacción
    await validarStockDisponible(almacenOrigenId, item.productoId, item.cantidad);
  }

  return await conTransaccion(async (tx) => {
    const resMov = await ejecutarSP<{ idMovimiento: number }>(
      'Inv_sp_inv_movimiento_crear_header',
      {
        tipoMovimiento: { valor: 'CONSUMO_OT', tipo: NVarChar },
        idUsuarioResponsable: { valor: item.idUsuario, tipo: Int },
        almacenOrigenId: { valor: almacenOrigenId || null, tipo: Int }, // Usar el almacén encontrado
        notas: { valor: `Consumo OT #${idOT}`, tipo: NVarChar },
        referenciaTexto: { valor: `OT-${idOT}`, tipo: NVarChar },
      },
      tx,
    );


    const idMov = resMov[0]?.idMovimiento;

    await ejecutarSP(
      'Inv_sp_inv_movimiento_procesar_item',
      {
        idMovimiento: { valor: idMov, tipo: Int },
        productoId: { valor: item.productoId, tipo: Int },
        cantidad: { valor: -Math.abs(item.cantidad), tipo: Decimal(18, 2) },
        propietarioTipo: { valor: 'EMPRESA', tipo: NVarChar },
        proveedorId: { valor: 0, tipo: Int },
      },
      tx,
    );

    await ejecutarSP(
      'Inv_sp_ot_consumo_registrar',
      {
        idOT: { valor: idOT, tipo: Int },
        productoId: { valor: item.productoId, tipo: Int },
        cantidad: { valor: item.cantidad, tipo: Decimal(18, 2) },
        idMovimientoInventario: { valor: idMov, tipo: Int },
      },
      tx,
    );

    return { idMovimiento: idMov };
  });
}

export async function asignarOT(idOT: number, idTecnico: number, idUsuarioResponsable: number) {
  const request = await crearRequest();
  request.input('idOT', Int, idOT);
  request.input('idTecnico', Int, idTecnico);
  const query = `
        UPDATE Inv_ope_ot 
        SET idTecnicoAsignado = @idTecnico,
            fechaAsignacion = GETDATE(),
            estado = CASE WHEN estado = 'PENDIENTE' THEN 'EN_PROGRESO' ELSE estado END
        WHERE idOT = @idOT
    `;
  await request.query(query);
  await logOTHistory(idOT, 'ASIGNACION', 'EN_PROGRESO', `Reasignado a técnico ID: ${idTecnico}`, idUsuarioResponsable);
}

export async function actualizarOT(idOT: number, dto: any, idUsuarioResponsable: number) {
  const request = await crearRequest();
  request.input('idOT', Int, idOT);

  let updates: string[] = [];
  if (dto.prioridad) { request.input('prio', NVarChar, dto.prioridad); updates.push("prioridad = @prio"); }
  if (dto.descripcionTrabajo) { request.input('desc', NVarChar, dto.descripcionTrabajo); updates.push("descripcionTrabajo = @desc"); }
  if (dto.notas) { request.input('notas', NVarChar, dto.notas); updates.push("notas = @notas"); }
  if (dto.clienteNombre) { request.input('cliente', NVarChar, dto.clienteNombre); updates.push("clienteNombre = @cliente"); }
  if (dto.clienteDireccion) { request.input('dir', NVarChar, dto.clienteDireccion); updates.push("clienteDireccion = @dir"); }
  if (dto.idTipoOT) { request.input('tipo', Int, dto.idTipoOT); updates.push("idTipoOT = @tipo"); }

  if (updates.length === 0) return;

  const query = `UPDATE Inv_ope_ot SET ${updates.join(', ')} WHERE idOT = @idOT`;
  await request.query(query);

  await logOTHistory(idOT, 'ACTUALIZACION', 'NO_CHANGE', 'Actualización de datos', idUsuarioResponsable, JSON.stringify(dto));
}

async function logOTHistory(idOT: number, accion: string, estado: string, notas: string, idUsuario: number | null, detalles?: string) {
  try {
    const query = `
            INSERT INTO Inv_ope_ot_historial (idOT, accion, estado, notas, idUsuario, fecha, cambios)
            VALUES (@idOT, @accion, @estado, @notas, @idUsuario, GETDATE(), @detalles)
        `;
    const request = await crearRequest();
    request.input('idOT', Int, idOT);
    request.input('accion', NVarChar, accion);
    request.input('estado', NVarChar, estado);
    request.input('notas', NVarChar, notas);
    request.input('idUsuario', Int, idUsuario);
    request.input('detalles', NVarChar, detalles || null);
    await request.query(query);
  } catch (e) {
    console.warn('Error logging OT history (Table might be missing)', e);
  }
}

export async function getHistorialOT(idOT: number) {
  try {
    const query = `
            SELECT h.*, u.nombre as usuarioNombre 
            FROM Inv_ope_ot_historial h
            LEFT JOIN Inv_seg_usuarios u ON h.idUsuario = u.idUsuario
            WHERE h.idOT = @idOT
            ORDER BY h.fecha DESC
        `;
    const request = await crearRequest();
    request.input('idOT', Int, idOT);
    const res = await request.query(query);
    return res.recordset;
  } catch (e) {
    return [];
  }
}


