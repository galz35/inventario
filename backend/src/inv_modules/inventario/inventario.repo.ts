import {
  Int,
  NVarChar,
  Decimal,
  DateTime,
  ejecutarSP,
  conTransaccion,
  ejecutarQuery,
} from '../../db/base.repo';
import { InvStock } from '../inv_types';

/**
 * Obtiene el stock actual filtrado por almacén o búsqueda
 */
export async function obtenerStock(filtros: {
  almacenId?: number;
  productoId?: number;
  buscar?: string;
}): Promise<InvStock[]> {
  return await ejecutarSP<InvStock>('Inv_sp_inv_stock_obtener', {
    almacenId: { valor: filtros.almacenId || null, tipo: Int },
    productoId: { valor: filtros.productoId || null, tipo: Int },
    buscar: { valor: filtros.buscar || null, tipo: NVarChar },
  });
}

/**
 * Obtiene específicamente el stock en consignación (De proveedores)
 */
export async function obtenerStockConsignado() {
  return await ejecutarQuery(`
        SELECT 
            s.productoId, p.nombre as productoNombre, p.codigo as productoCodigo,
            s.almacenId, a.nombre as almacenNombre,
            s.proveedorId, prov.nombre as proveedorNombre,
            s.cantidad, p.unidad
        FROM Inv_inv_stock s
        JOIN Inv_cat_productos p ON s.productoId = p.idProducto
        JOIN Inv_cat_almacenes a ON s.almacenId = a.idAlmacen
        JOIN Inv_cat_proveedores prov ON s.proveedorId = prov.idProveedor
        WHERE s.propietarioTipo = 'PROVEEDOR' AND s.cantidad > 0
        ORDER BY prov.nombre, p.nombre
    `);
}

/**
 * Registra un movimiento de inventario (Entrada, Salida, Ajuste, etc.)
 * Procesa la cabecera y el detalle en una sola transacción.
 */
export async function registrarMovimiento(dto: {
  tipoMovimiento: string;
  almacenOrigenId?: number;
  almacenDestinoId?: number;
  idUsuarioResponsable: number;
  notas?: string;
  referenciaTexto?: string;
  detalles: {
    productoId: number;
    cantidad: number;
    propietarioTipo?: string;
    proveedorId?: number;
    costoUnitario?: number;
  }[];
}) {
  return await conTransaccion(async (tx) => {
    // 1. Crear Cabecera del Movimiento
    const resMov = await ejecutarSP<{ idMovimiento: number }>(
      'Inv_sp_inv_movimiento_crear_header',
      {
        tipoMovimiento: { valor: dto.tipoMovimiento, tipo: NVarChar },
        almacenOrigenId: { valor: dto.almacenOrigenId || null, tipo: Int },
        almacenDestinoId: { valor: dto.almacenDestinoId || null, tipo: Int },
        idUsuarioResponsable: { valor: dto.idUsuarioResponsable, tipo: Int },
        notas: { valor: dto.notas || null, tipo: NVarChar },
        referenciaTexto: { valor: dto.referenciaTexto || null, tipo: NVarChar },
      },
      tx,
    );

    const idMovimiento = resMov[0].idMovimiento;

    // 2. Procesar cada ítem del detalle
    for (const item of dto.detalles) {
      await ejecutarSP(
        'Inv_sp_inv_movimiento_procesar_item',
        {
          idMovimiento: { valor: idMovimiento, tipo: Int },
          productoId: { valor: item.productoId, tipo: Int },
          cantidad: { valor: item.cantidad, tipo: Decimal(18, 2) },
          propietarioTipo: {
            valor: item.propietarioTipo || 'EMPRESA',
            tipo: NVarChar,
          },
          proveedorId: { valor: item.proveedorId || 0, tipo: Int },
          costoUnitario: {
            valor: item.costoUnitario || 0,
            tipo: Decimal(18, 2),
          },
          // El SP interno debe encargarse de:
          // a) Validar existencias si es salida
          // b) Actualizar Inv_inv_stock
          // c) Insertar en Inv_inv_movimiento_detalle
        },
        tx,
      );
    }

    return idMovimiento;
  });
}

/**
 * Obtiene el Kardex detallado de un producto en un almacén específico
 */
export async function obtenerKardex(filtros: {
  almacenId: number;
  productoId: number;
  fechaInicio?: Date;
  fechaFin?: Date;
}) {
  return await ejecutarSP('Inv_sp_inv_kardex_obtener', {
    almacenId: { valor: filtros.almacenId, tipo: Int },
    productoId: { valor: filtros.productoId, tipo: Int },
    fechaInicio: { valor: filtros.fechaInicio || null, tipo: DateTime },
    fechaFin: { valor: filtros.fechaFin || null, tipo: DateTime },
  });
}

/**
 * Inicia una transferencia entre almacenes (Resta stock de origen)
 */
/**
 * Realiza una transferencia directa entre almacenes (Impacto inmediato en Origen y Destino)
 * Se eliminó el paso intermedio de confirmación para reducir fricción.
 */
export async function enviarTransferencia(dto: {
  almacenOrigenId: number;
  almacenDestinoId: number;
  idUsuarioEnvia: number; // Usado también como receptor automático
  notas?: string;
  detalles: { productoId: number; cantidad: number }[];
}) {
  return await conTransaccion(async (tx) => {
    // 1. Iniciar la transferencia (Resta Origen)
    const resEnvio = await ejecutarSP<{ idTransferencia: number }>(
      'Inv_sp_inv_transferencia_enviar',
      {
        almacenOrigenId: { valor: dto.almacenOrigenId, tipo: Int },
        almacenDestinoId: { valor: dto.almacenDestinoId, tipo: Int },
        idUsuarioEnvia: { valor: dto.idUsuarioEnvia, tipo: Int },
        notas: { valor: dto.notas || 'Transferencia Directa', tipo: NVarChar },
      },
      tx,
    );

    const idTransferencia = resEnvio[0].idTransferencia;

    // 2. Insertar ítems
    for (const item of dto.detalles) {
      await ejecutarSP(
        'Inv_sp_inv_transferencia_item_enviar',
        {
          idTransferencia: { valor: idTransferencia, tipo: Int },
          productoId: { valor: item.productoId, tipo: Int },
          cantidad: { valor: item.cantidad, tipo: Decimal(18, 2) },
        },
        tx,
      );
    }

    // 3. Confirmar automáticamente (Suma Destino inmediatamente)
    // Usamos el mismo usuario que envía para confirmar, ya que es un "Traslado Directo"
    await ejecutarSP(
      'Inv_sp_inv_transferencia_confirmar',
      {
        idTransferencia: { valor: idTransferencia, tipo: Int },
        idUsuarioRecibe: { valor: dto.idUsuarioEnvia, tipo: Int }, // Auto-confirmación
      },
      tx,
    );

    return idTransferencia;
  });
}

/**
 * Confirma la recepción de una transferencia (Suma stock en destino)
 */
export async function confirmarTransferencia(
  idTransferencia: number,
  idUsuarioRecibe: number,
) {
  return await ejecutarSP('Inv_sp_inv_transferencia_confirmar', {
    idTransferencia: { valor: idTransferencia, tipo: Int },
    idUsuarioRecibe: { valor: idUsuarioRecibe, tipo: Int },
  });
}
/**
 * Carga de stock masiva desde Excel
 * Recibe una lista de items con código y los procesa como movimientos de entrada.
 */
export async function importarStockPorExcel(dto: {
  almacenId: number;
  idUsuario: number;
  items: {
    codigo: string;
    cantidad: number;
    propietarioTipo: string;
    proveedorId: number;
    costoUnitario: number;
  }[];
}) {
  return await conTransaccion(async (tx) => {
    // 1. Crear cabecera única para toda la carga
    const resMov = await ejecutarSP<{ idMovimiento: number }>(
      'Inv_sp_inv_movimiento_crear_header',
      {
        tipoMovimiento: { valor: 'ENTRADA_CARGA_MASIVA', tipo: NVarChar },
        almacenOrigenId: { valor: null, tipo: Int },
        almacenDestinoId: { valor: dto.almacenId, tipo: Int },
        idUsuarioResponsable: { valor: dto.idUsuario, tipo: Int },
        notas: { valor: 'Carga masiva desde archivo Excel', tipo: NVarChar },
        referenciaTexto: {
          valor: 'IMPORT_EXCEL_' + Date.now(),
          tipo: NVarChar,
        },
      },
      tx,
    );

    const idMovimiento = resMov[0].idMovimiento;

    // 2. Procesar cada ítem resolviendo el ID por código
    for (const item of dto.items) {
      // Buscamos el ID del producto por su código
      const resProd = await tx
        .request()
        .input('codigo', NVarChar, item.codigo)
        .query(
          'SELECT idProducto FROM Inv_cat_productos WHERE codigo = @codigo',
        );

      if (resProd.recordset.length === 0) {
        throw new Error(
          `Producto con código [${item.codigo}] no existe en el catálogo.`,
        );
      }

      const productoId = resProd.recordset[0].idProducto;

      await ejecutarSP(
        'Inv_sp_inv_movimiento_procesar_item',
        {
          idMovimiento: { valor: idMovimiento, tipo: Int },
          productoId: { valor: productoId, tipo: Int },
          cantidad: { valor: item.cantidad, tipo: Decimal(18, 2) },
          propietarioTipo: { valor: item.propietarioTipo, tipo: NVarChar },
          proveedorId: { valor: item.proveedorId, tipo: Int },
          costoUnitario: { valor: item.costoUnitario, tipo: Decimal(18, 2) },
        },
        tx,
      );
    }

    return { idMovimiento, totalProcesados: dto.items.length };
  });
}

/**
 * Registra una entrada de mercadería de un proveedor (Compra o Consignación)
 * Simplifica la interfaz para el usuario final.
 */
export async function registrarEntradaProveedor(dto: {
  almacenDestinoId: number;
  proveedorId: number;
  esConsignacion: boolean;
  idUsuario: number;
  detalles: { productoId: number; cantidad: number; costoUnitario?: number }[];
}) {
  return await registrarMovimiento({
    tipoMovimiento: dto.esConsignacion
      ? 'ENTRADA_CONSIGNACION'
      : 'ENTRADA_COMPRA',
    almacenDestinoId: dto.almacenDestinoId,
    idUsuarioResponsable: dto.idUsuario,
    referenciaTexto: `Entrada Prov ID:${dto.proveedorId} | ${dto.esConsignacion ? 'CONSIG' : 'COMPRA'}`,
    detalles: dto.detalles.map((d) => ({
      ...d,
      propietarioTipo: dto.esConsignacion ? 'PROVEEDOR' : 'EMPRESA',
      proveedorId: dto.proveedorId,
    })),
  });
}

/**
 * Obtiene lista de transferencias realizadas
 */
export async function obtenerTransferencias(
  filtros: { idAlmacen?: number; estado?: string } = {},
) {
  return await ejecutarQuery(
    `
        SELECT 
            t.idTransferencia,
            t.almacenOrigenId, ao.nombre as almacenOrigenNombre,
            t.almacenDestinoId, ad.nombre as almacenDestinoNombre,
            t.idUsuarioEnvia, ue.nombre as usuarioEnviaNombre,
            t.idUsuarioRecibe, ur.nombre as usuarioRecibeNombre,
            t.fechaEnvio, t.fechaRecepcion, t.estado, t.notas
        FROM Inv_inv_transferencias t
        JOIN Inv_cat_almacenes ao ON t.almacenOrigenId = ao.idAlmacen
        JOIN Inv_cat_almacenes ad ON t.almacenDestinoId = ad.idAlmacen
        LEFT JOIN Inv_seg_usuarios ue ON t.idUsuarioEnvia = ue.idUsuario
        LEFT JOIN Inv_seg_usuarios ur ON t.idUsuarioRecibe = ur.idUsuario
        WHERE (@idAlmacen IS NULL OR t.almacenOrigenId = @idAlmacen OR t.almacenDestinoId = @idAlmacen)
          AND (@estado IS NULL OR t.estado = @estado)
        ORDER BY t.fechaEnvio DESC
    `,
    {
      idAlmacen: { valor: filtros.idAlmacen || null, tipo: Int },
      estado: { valor: filtros.estado || null, tipo: NVarChar },
    },
  );
}

/**
 * Obtiene los detalles (ítems) de una transferencia
 */
export async function obtenerTransferenciaDetalles(idTransferencia: number) {
  return await ejecutarQuery(
    `
        SELECT 
            d.productoId,
            p.nombre as productoNombre,
            p.codigo as productoCodigo,
            d.cantidad
        FROM Inv_inv_transferencias_detalles d
        JOIN Inv_cat_productos p ON d.productoId = p.idProducto
        WHERE d.idTransferencia = @id
    `,
    {
      id: { valor: idTransferencia, tipo: Int },
    },
  );
}
