Archivo: frontend/src/modules/dashboard/DashboardView.tsx

Diseño
- Encabezado con saludo y botones de acción (Crear OT, Buscar Serial).
- Grid de KPIs con tarjetas grandes y colores por categoría.
- Sección de gráficos: área para evolución financiera y pie para estados OT.
- Tabla de actividad reciente con scroll horizontal y badges de estado.

Posibles errores / riesgos
- Se usa data de tendencia inventada (inventoryTrend) sin indicar que es mock; puede confundir si no hay datos reales.
- El tiempo de actividad usa new Date(item.fechaCreation); si fechaCreation es null o inválida, puede mostrar "Invalid Date".
- El fallback en getDashboardMetrics usa objeto vacío, pero se asume valorInventario numérico al formatear; puede producir NaN si llega string.

Mejoras concretas
- Indicar visualmente cuando un gráfico usa datos simulados o incluir flag de "sin datos".
- Normalizar fechas antes de usar toLocaleDateString/toLocaleTimeString.
- Usar formatter numérico con fallback para evitar NaN en KPIs.
