Archivo: frontend/src/modules/consignacion/ConsignacionView.tsx

Diseño
- Encabezado con título e icono de moneda.
- KPIs de deuda pendiente y liquidaciones.
- Tabs para pendientes, stock y historial con filtros de fecha.
- Cards para proveedores pendientes, tabla agrupada por proveedor y modales de detalle.

Posibles errores / riesgos
- calculateAll recorre proveedores con llamadas secuenciales; en listas grandes puede tardar mucho y bloquear UI.
- handleProcess usa confirm() del navegador; rompe consistencia visual con alert.service.
- En stock agrupado, se usa items[0].proveedorId sin validar que items tenga elementos; aunque por construcción debería, no hay guard.
- En historyColumns, estado se renderiza siempre como badge-success, sin considerar estados fallidos.

Mejoras concretas
- Paralelizar calculateAll con Promise.all y manejar límite de concurrencia.
- Reemplazar confirm() por alertConfirm para mantener estilo.
- Agregar fallback si no hay proveedorId en items.
- Mapear estado a badges según valor real.
