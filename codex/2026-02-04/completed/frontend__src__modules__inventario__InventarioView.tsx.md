Archivo: frontend/src/modules/inventario/InventarioView.tsx

Diseño
- Dashboard con tarjetas KPI (SKUs, almacenes, valor inventario).
- Barra de búsqueda y botones de filtros (Todos, Bajo stock, Alto valor) y export PDF.
- DataTable con acciones (Ver Historial) y filtros de almacén.
- Panel lateral con ficha de producto y timeline de movimientos (kardex).
- Modales: entrada manual, importación Excel y vista previa con validación.

Posibles errores / riesgos
- Se usa localStorage.getItem('inv_user') sin try/catch; si hay JSON inválido, puede lanzar error en render inicial.
- En Excel preview, los checks de "incluir" mutan el array y se reusa el mismo objeto; si hay grandes listas puede generar estado inconsistente por mutación directa.
- En importación masiva, se construye detalles con productoId potencialmente undefined si el producto no existe (prod?.idProducto); no se valida antes de enviar.
- Al cargar almacenes, si alms[0].idAlmacen es number, se asigna directamente a targetAlmacen y entryForm.almacenId, pero el estado se maneja como string; puede causar comparaciones fallidas.
- En filtros, el searchTerms se crea con split(' '); si la búsqueda contiene espacios múltiples se generan términos vacíos y todo coincide.

Mejoras concretas
- Envolver JSON.parse en try/catch para inv_user y limpiar si falla.
- Crear una copia profunda al alternar incluir para evitar mutación directa.
- Filtrar itemsToImport para asegurar productoId válido y reportar filas inconsistentes.
- Normalizar todos los ids como string o number de forma consistente.
- Limpiar terms vacíos en searchTerms para evitar filtros poco precisos.
