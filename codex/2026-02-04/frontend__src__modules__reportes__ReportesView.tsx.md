Archivo: frontend/src/modules/reportes/ReportesView.tsx

Diseño
- Encabezado principal con título y descripción.
- Tarjetas KPI (SLA, tiempo promedio, OTs fuera de tiempo).
- Tabs internas para SLA, consumo, consumo técnico y cierre mensual.
- DataTable para SLA/Consumo; vistas hijas para técnico y cierre.

Posibles errores / riesgos
- Los KPIs son valores fijos; no están vinculados a datos reales.
- En fetchReports, si una llamada falla se pierde la otra; no hay fallback por reporte.

Mejoras concretas
- Conectar KPIs a datos reales o indicar explícitamente que son estimados.
- Separar llamadas con try/catch independientes y setear estados parciales.
