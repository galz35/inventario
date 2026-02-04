Archivo: frontend/src/modules/activos/ActivosView.tsx

Diseño
- Encabezado con botón de nuevo activo.
- Barra de filtros con búsqueda y estado.
- Tabla propia (no DataTable) con columnas de serie, producto, ubicación y acciones.
- Panel lateral con ficha y timeline de movimientos.
- Modal de creación de activo.

Posibles errores / riesgos
- fetchActivos usa busqueda y filtroEstado pero el useEffect depende solo de filtroEstado; escribir en búsqueda no actualiza resultados hasta submit.
- En fetchMasters, se usa p.data.data || [] y a.data.data || [] sin fallback a p.data; si la API no envía data.data, se pierde contenido.
- handleViewHistory usa getHistoriaProducto con activo.idProducto; si el activo tiene historial por serial, no se consulta por serial.

Mejoras concretas
- Incluir busqueda en dependencia o botón claro "Buscar" para consistencia de UX.
- Normalizar respuestas p.data.data || p.data.
- Agregar endpoint de historial por activo serial si está disponible.
