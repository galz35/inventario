Archivo: frontend/src/modules/usuarios/WorkloadView.tsx

Diseño
- Encabezado con conmutador Tabla/Calendario.
- KPIs de técnicos, ocupados y disponibles.
- Vista tabla con chips de OTs activas.
- Vista calendario tipo matriz por técnico (7 columnas de días).
- Modal para asignar OT existente o crear OT rápida.

Posibles errores / riesgos
- En CalendarView, el slot de trabajo se muestra solo si i === 2 (comentado como mock). Esto no representa el día real y puede confundir.
- setSelectedDate usa selectedDate.setMonth, que muta la instancia Date; puede producir efectos secundarios en render.
- loadData no filtra técnicos por activo; se muestran todos los usuarios con rol técnico.

Mejoras concretas
- Reemplazar el mock de i === 2 por lógica de fechas reales.
- Usar new Date(selectedDate) al cambiar mes para evitar mutación.
- Filtrar técnicos activos y ordenar por carga.
