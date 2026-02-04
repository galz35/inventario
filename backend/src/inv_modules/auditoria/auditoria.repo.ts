import { ejecutarQuery, Int, NVarChar, Decimal } from '../../db/base.repo';

export async function listarAuditorias() {
    return await ejecutarQuery(`
        SELECT 
            a.idConteo, 
            alm.nombre as almacenNombre, 
            a.fechaInicio, 
            a.estado 
        FROM Inv_aud_conteos a
        JOIN Inv_cat_almacenes alm ON a.idAlmacen = alm.idAlmacen
        ORDER BY a.fechaInicio DESC
    `);
}

export async function iniciarAuditoria(datos: any) {
    // 1. Crear cabecera de conteo
    const res = await ejecutarQuery(`
        INSERT INTO Inv_aud_conteos (idAlmacen, fechaInicio, estado, nombre_referencia, idUsuarioResponsable)
        VALUES (@idAlmacen, GETDATE(), 'EN PROCESO', @nombre, @idUsuario);
        SELECT SCOPE_IDENTITY() as id;
    `, {
        idAlmacen: { valor: datos.almacenId, tipo: Int },
        nombre: { valor: datos.nombre, tipo: NVarChar },
        idUsuario: { valor: datos.idUsuario, tipo: Int }
    });

    const idConteo = res[0].id;

    // 2. Snapshot: Copiar stock actual a tabla de detalle para comparar
    await ejecutarQuery(`
        INSERT INTO Inv_aud_conteo_detalles (idConteo, idProducto, sistemaQty, conteoQty)
        SELECT @idConteo, idProducto, cantidad, 0
        FROM Inv_stk_contenido
        WHERE idAlmacen = @idAlmacen
    `, {
        idConteo: { valor: idConteo, tipo: Int },
        idAlmacen: { valor: datos.almacenId, tipo: Int }
    });

    return { idConteo };
}

export async function conciliarAuditoria(datos: any) {
    const { idConteo, items } = datos;

    // 1. Actualizar conteos físicos
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

    // 2. Cerrar auditoría
    await ejecutarQuery(`
        UPDATE Inv_aud_conteos 
        SET estado = 'FINALIZADO', fechaFin = GETDATE()
        WHERE idConteo = @idConteo
    `, { idConteo: { valor: idConteo, tipo: Int } });

    // (Opcional: Aquí se podrían generar movimientos de ajuste automático)
    return { success: true };
}

export async function listarCierresMensuales() {
    // Si no existe tabla de cierres, retornamos mock o vacío por ahora
    // Asumiremos que existe Inv_rep_cierres_mensuales
    try {
        return await ejecutarQuery(`SELECT TOP 12 * FROM Inv_rep_cierres_mensuales ORDER BY fechaCorte DESC`);
    } catch (e) {
        return [];
    }
}

export async function generarCierreMensual(datos: any) {
    // Calcula valor total del inventario actual
    const totales = await ejecutarQuery(`
        SELECT SUM(c.cantidad * p.precioBase) as valorTotal, COUNT(*) as totalItems
        FROM Inv_stk_contenido c
        JOIN Inv_cat_productos p ON c.idProducto = p.idProducto
    `);

    const { valorTotal, totalItems } = totales[0];

    // Guarda el registro histórico
    await ejecutarQuery(`
        INSERT INTO Inv_rep_cierres_mensuales (mes, fechaCorte, totalItems, valorTotal, estado, idUsuarioGenera)
        VALUES (@mes, GETDATE(), @totalItems, @valorTotal, 'CERRADO', @idUsuario)
    `, {
        mes: { valor: datos.mes, tipo: NVarChar }, // "Febrero 2026"
        totalItems: { valor: totalItems || 0, tipo: Int },
        valorTotal: { valor: valorTotal || 0, tipo: Decimal },
        idUsuario: { valor: datos.idUsuario, tipo: Int }
    });

    return { success: true };
}
