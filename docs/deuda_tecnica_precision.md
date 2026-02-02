# INFORME DE DEUDA TÉCNICA: PRECISIÓN Y TRAZABILIDAD (INVCORE)

Este documento detalla los puntos críticos que deben fortalecerse para garantizar una **exactitud del 100% en el inventario** y una **trazabilidad de origen-destino instantánea**, independientemente de la ubicación física del producto.

## 1. TRAZABILIDAD DE ORIGEN (EL "ADN" DEL PRODUCTO)
*   **Deuda**: Actualmente, una transferencia solo registra de qué almacén viene. No arrastra la información de "Factura de Compra" o "Liquidación de Proveedor" a través de múltiples saltos (ej. Central -> Regional -> Camioneta).
*   **Riesgo**: Si un producto sale defectuoso, es difícil rastrear a qué proveedor se le compró una vez que ya se movió 3 veces.
*   **Solución Pendiente**: Implementar "Trace ID" por lote que viaje en el detalle de cada movimiento (Kardex extendido).

## 2. VALIDACIÓN DE CARGA FÍSICA VS. SISTEMA
*   **Deuda**: El técnico puede marcar que consumió 5 conectores sin validar si realmente los tiene físicamente en su camioneta (el sistema permite stock negativo si no hay restricciones duras).
*   **Riesgo**: El inventario del técnico se vuelve una "caja negra" hasta que se hace una auditoría manual.
*   **Solución Pendiente**: Activar un "Check de Salida" obligatorio: El técnico debe escanear o confirmar stock antes de iniciar ruta.

## 3. CONCILIACIÓN DE ACTIVOS SERIALIZADOS
*   **Deuda**: Si un técnico reemplaza un Router, el sistema registra el cambio, pero el equipo dañado queda en un estado de "limbo" (REPARACION/BAJA) que requiere confirmación manual de recepción en bodega.
*   **Riesgo**: Pérdida de equipos costosos por falta de "Cierre de Devolución".
*   **Solución Pendiente**: Crear una "Hoja de Ruta de Devolución" automática: Cada equipo serializado retirado debe generar una alerta de "Equipo en Tránsito" hasta que la bodega central escanee su regreso.

## 4. INTEGRIDAD TRANSACCIONAL (RACE CONDITIONS)
*   **Deuda**: Aunque los SPs usan `UPDLOCK`, si dos procesos intentan mover el mismo item al mismo milisegundo desde fuentes distintas (API y Procedimiento Programado), podría haber micro-desfases.
*   **Riesgo**: Diferencias de centavos o unidades en reportes de alta frecuencia.
*   **Solución Pendiente**: Implementar niveles de aislamiento `SERIALIZABLE` en los SPs de ajuste de stock más críticos.

## 5. VISIBILIDAD MULTI-UBICACIÓN INSTANTÁNEA
*   **Deuda**: La consulta de stock actual es por almacén. No hay una vista de "Dónde está mi Producto X" que sume stock en bodegas + stock en manos de técnicos + stock en tránsito.
*   **Riesgo**: Lentitud operativa al buscar materiales en una emergencia.
*   **Solución Pendiente**: Crear una vista indexada (`INV_v_existencia_global`) que consolide todas las dimensiones del inventario en una sola consulta de <100ms.

## 🛑 PUNTOS HACIA LA "PRECISIÓN EXACTA":
1.  **Bloqueo de Stock Negativo**: Impedir cualquier movimiento que deje saldo menor a cero (actualmente es una validación lógica, debe ser una restricción a nivel BD).
2.  **Audit Log de Base de Datos**: Registrar no solo el movimiento (Kardex), sino quién modificó el registro de stock directamente (Trigger de Auditoría).
3.  **Digitalización de Evidencia**: Obligar a que cada descuento de inventario en OT tenga una foto del material instalado.
