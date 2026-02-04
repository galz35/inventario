Archivo: frontend/src/modules/operaciones/PlanificacionView.tsx

Diseño
- Vista inicial con DataTable de proyectos y botón de nuevo proyecto.
- Al seleccionar proyecto, header con acciones y tabs (WBS, Historial).
- WBS con filas jerárquicas, badges de recursos y botones de edición.
- Modales para proyecto, tarea y asignación de recursos (materiales/personal).

Posibles errores / riesgos
- fetchCatalogs usa invService.getCatalog('usuarios'); si no existe endpoint, users quedará vacío y no se podrá asignar responsable.
- En handleSaveResource se dispara alertSuccess dos veces (dentro de cada rama y luego al final), lo que duplica notificación.
- formEst.productoId se usa con == en filtro de productos; si el id es string/number puede funcionar, pero falta normalización consistente.
- En historial, render de detalle solo maneja tipo 'ASIGNACION'; otros tipos quedan sin detalle.

Mejoras concretas
- Validar existencia del endpoint de usuarios o usar authService.getUsers.
- Eliminar alertSuccess duplicado y dejar una sola confirmación.
- Normalizar ids como number en formEst para evitar comparaciones laxas.
- Agregar render genérico de detalles para eventos distintos a ASIGNACION.
