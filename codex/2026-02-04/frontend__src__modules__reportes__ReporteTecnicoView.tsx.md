Archivo: frontend/src/modules/reportes/ReporteTecnicoView.tsx

Diseño
- Encabezado con selector de fecha y título.
- Tarjetas KPI (total movimientos, items consignados).
- DataTable de detalle por técnico y OT.

Posibles errores / riesgos
- loadReport se dispara en cada cambio de fecha sin debounce; puede generar múltiples llamadas.
- El cálculo de consignedItems depende de proveedorConsignado; si la API usa otro campo, el KPI será 0.

Mejoras concretas
- Agregar debounce o botón "Consultar" para evitar llamadas continuas.
- Normalizar el campo de consignación o validar con el backend para consistencia.
