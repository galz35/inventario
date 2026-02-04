Archivo: frontend/src/modules/operaciones/OperacionesView.tsx

Diseño
- Vista con conmutador Lista/Tablero y botón de nueva OT para supervisores.
- DataTable con columnas de OT, badges de estado y prioridad.
- Modal para creación de OT con secciones cliente y detalles.
- Panel lateral con pestañas (Detalle, Evidencias, Historial).
- Flujo técnico con pasos: materiales, checklist y firma en canvas.

Posibles errores / riesgos
- En handleFinalize, si canvas existe pero está vacío, canvas.toDataURL devuelve string; se intenta subir evidencia aunque no haya firma visible.
- En pestaña Historial, se usa opeService.getHistorialOT(...).then(r => setHistorialList(r.data)); si la API devuelve res.data.data, el estado puede quedar con objeto no esperado.
- En el tablero Kanban, el estado 'ASIGNADA' se mapea a 'PENDIENTE'; pero no se muestran columnas para 'ASIGNADA' explícitas, puede ocultar estados reales.
- Para materiales, se usa productos del stock global; no se filtra por almacén del técnico ni disponibilidad local.

Mejoras concretas
- Validar si el canvas tiene trazos antes de subir la firma.
- Normalizar respuesta de historial (data.data || data).
- Considerar columnas para estados adicionales o mapping controlado.
- Filtrar productos por almacén o stock disponible por técnico para evitar consumos inválidos.
