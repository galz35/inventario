Archivo: frontend/src/modules/operaciones/BacklogView.tsx

Diseño
- Encabezado con título e introducción.
- Tarjeta de filtros con selects de estado/prioridad y checkbox "sin asignar".
- Métricas rápidas en grid (urgentes, sin asignar, en curso, total).
- DataTable de OTs y modal de asignación.

Posibles errores / riesgos
- loadData usa opeService.listarOTs(filters), pero aplica el filtro sinAsignar en frontend; si el backend ya filtra, puede duplicar lógica.
- En métricas, el grid es fijo a 4 columnas; en pantallas pequeñas puede desbordar sin ajuste de columnas responsivas.
- En modal de asignación, el listado de técnicos no filtra por activo; se muestran todos.

Mejoras concretas
- Convertir métricas a grid responsive con auto-fit.
- Filtrar técnicos activos y ordenar por carga si esa data existe.
- Ajustar filtros para evitar doble filtrado (backend/frontend) y mantener una sola fuente de verdad.
