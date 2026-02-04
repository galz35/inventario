import { ejecutarSP, Int, NVarChar, ejecutarQuery, Decimal } from '../../db/base.repo';

export async function iniciarConteo(
  almacenId: number,
  idUsuario: number,
  notas?: string,
) {
  // Existing logic: Try to use SP if available
  try {
    const res = await ejecutarSP<{ idConteo: number }>('Inv_sp_conteo_iniciar', {
      almacenId: { valor: almacenId, tipo: Int },
      idUsuario: { valor: idUsuario, tipo: Int },
      notas: { valor: notas || null, tipo: NVarChar },
    });
    return res[0]?.idConteo;
  } catch (e) {
    // Fallback to manual snapshot if SP fails (legacy)
    const res = await ejecutarQuery(`
          INSERT INTO Inv_aud_conteos (almacenId, fechaInicio, estado, nombre_referencia, idResponsable)
          VALUES (@almacenId, GETDATE(), 'EN PROCESO', @notas, @idUsuario);
          SELECT SCOPE_IDENTITY() as id;
      `, {
      almacenId: { valor: almacenId, tipo: Int },
      notas: { valor: notas, tipo: NVarChar },
      idUsuario: { valor: idUsuario, tipo: Int }
    });
    const idConteo = res[0].id;

    await ejecutarQuery(`
          INSERT INTO Inv_aud_conteo_detalles (idConteo, idProducto, sistemaQty, conteoQty)
          SELECT @idConteo, idProducto, cantidad, 0
          FROM Inv_stk_contenido
          WHERE idAlmacen = @almacenId
      `, { idConteo: { valor: idConteo, tipo: Int }, almacenId: { valor: almacenId, tipo: Int } });

    return idConteo;
  }
}

export async function conciliarAuditoria(datos: any) {
  const { idConteo, items } = datos;
  for (const item of items) {
    await ejecutarQuery(`
            UPDATE Inv_aud_conteo_detalles 
            SET conteoQty = @qty 
            WHERE idConteo = @idConteo AND idProducto = @idProducto
        `, {
      idConteo: { valor: idConteo, tipo: Int },
      idProducto: { valor: item.productoId, tipo: Int },
      qty: { valor: item.countedQty, tipo: Int }
    });
  }

  await ejecutarQuery(`
        UPDATE Inv_aud_conteos 
        SET estado = 'FINALIZADO', fechaFin = GETDATE()
        WHERE idConteo = @idConteo
    `, { idConteo: { valor: idConteo, tipo: Int } });

  return { success: true };
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
  return await ejecutarQuery(`
        SELECT c.idConteo, a.nombre as almacenNombre, c.fechaInicio, c.fechaFin, c.estado, u.nombre as responsableNombre
        FROM Inv_aud_conteos c
        JOIN Inv_cat_almacenes a ON c.almacenId = a.idAlmacen
        LEFT JOIN Inv_seg_usuarios u ON c.idResponsable = u.idUsuario
        ORDER BY c.fechaInicio DESC
    `);
}

export async function listarCierresMensuales() {
  try {
    return await ejecutarQuery(`SELECT TOP 12 * FROM Inv_rep_cierres_mensuales ORDER BY fechaCorte DESC`);
  } catch (e) {
    return [];
  }
}

export async function generarCierreMensual(datos: any) {
  const totales = await ejecutarQuery(`
        SELECT SUM(c.cantidad * p.precioBase) as valorTotal, COUNT(*) as totalItems
        FROM Inv_stk_contenido c
        JOIN Inv_cat_productos p ON c.idProducto = p.idProducto
    `);
  const { valorTotal, totalItems } = totales[0];
  await ejecutarQuery(`
        INSERT INTO Inv_rep_cierres_mensuales (mes, fechaCorte, totalItems, valorTotal, estado, idUsuarioGenera)
        VALUES (@mes, GETDATE(), @totalItems, @valorTotal, 'CERRADO', @idUsuario)
    `, {
    mes: { valor: datos.mes, tipo: NVarChar },
    totalItems: { valor: totalItems || 0, tipo: Int },
    valorTotal: { valor: valorTotal || 0, tipo: Decimal },
    idUsuario: { valor: datos.idUsuario, tipo: Int }
  });
  return { success: true };
}
