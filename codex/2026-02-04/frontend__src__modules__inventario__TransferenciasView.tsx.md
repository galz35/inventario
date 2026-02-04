Archivo: frontend/src/modules/inventario/TransferenciasView.tsx

Diseño
- DataTable con historial de traslados y botón principal para crear solicitud.
- Modal de creación con selectores de almacén y buscador de producto.
- Tabla interna de ítems y textarea para notas.
- Modal de detalles con tabla de ítems y resumen de origen/destino.

Posibles errores / riesgos
- En handleOpenCreate, para técnico se usa user.idAlmacen en origen y user.idAlmacenTecnico en destino; si el usuario no tiene idAlmacen pero sí idAlmacenTecnico, el stock origen no se carga.
- fetchTransferencias filtra por rol 'Tecnico' o 'TECNICO', pero isTecnico se evalúa con rolNombre toUpperCase === 'TECNICO'; podría haber desalineación si rolNombre es 'Tecnico'.
- En addItem no se valida que cantidad sea entera positiva (permite decimales) y se usa Number sin redondeo.

Mejoras concretas
- Normalizar rolNombre en una función helper para evitar comparaciones inconsistentes.
- Agregar validación de cantidad y deshabilitar "Añadir" cuando stock insuficiente.
- Mostrar estado vacío en el modal de detalles cuando no hay ítems.
