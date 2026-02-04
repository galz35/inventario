Archivo: frontend/src/modules/auditoria/AuditoriaView.tsx

Diseño
- Flujo por pasos: listado, conteo físico y revisión de variaciones.
- Tabla de conteo con inputs numéricos y resaltado de celdas.
- Vista de variaciones con métricas e impacto económico.
- Modal de creación con advertencia y selección de almacén.

Posibles errores / riesgos
- loadAlmacenes no maneja errores; si falla, el select queda vacío sin feedback.
- handleStartAudit usa invService.getStock y asume que respuesta tiene almacenNombre en auditData, pero solo pasa almacenId; auditData.almacenNombre puede quedar undefined.
- La tabla de conteo usa input type number con parseInt; para cantidades con decimales se truncaría.

Mejoras concretas
- Agregar manejo de errores en loadAlmacenes y mensaje en UI.
- Incluir almacenNombre en auditData usando el catálogo de almacenes para mostrar en conteo.
- Usar parseFloat si se permiten cantidades fraccionarias o bloquear decimales en input.
