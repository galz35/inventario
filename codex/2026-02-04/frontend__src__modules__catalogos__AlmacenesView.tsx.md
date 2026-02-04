Archivo: frontend/src/modules/catalogos/AlmacenesView.tsx

Diseño
- DataTable simple con columnas de nombre, tipo, ubicación, dependencia y estado.
- Botón "Nuevo Almacén" en acciones.

Posibles errores / riesgos
- El botón "Nuevo Almacén" no tiene handler; genera un control sin acción.
- Si val no existe en colors, el render del tipo intenta usar colors[val] y produce undefined; no hay fallback visual.

Mejoras concretas
- Agregar modal de creación o eliminar el botón si no está implementado.
- Incluir fallback de color para tipos no previstos.
