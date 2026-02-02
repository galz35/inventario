documento completado
# Plan de Trabajo: Vinculación OT-Tarea y Carga Masiva

Este documento rastrea el progreso de las mejoras solicitadas para cumplir con la documentación del sistema.

## 1. Vinculación Operativa (OT ↔ Tarea)
El objetivo es asegurar la trazabilidad entre lo planificado (WBS) y lo ejecutado (OTs).

- [x] **Base de Datos**: Agregar columna `idTarea` a `Inv_ope_ot` y FK.
- [x] **Base de Datos**: Actualizar SP `Inv_sp_ot_crear` para recibir `@idTarea`.
- [x] **Backend (Repo)**: Actualizar interface `InvOT` y función `crearOT` en `operaciones.repo.ts`.
- [x] **Backend (Controller)**: Verificar DTOs y paso de parámetros en `operaciones.controller.ts`.
- [x] **Frontend**: Actualizar formulario de creación de OT para cargar desplegable de Tareas cuando se selecciona un Proyecto.

## 2. Carga Masiva de Stock (Excel)
El objetivo es habilitar la funcionalidad de importación desde la UI.

- [x] **Frontend**: Agregar botón "Importar Excel" en `InventarioView.tsx`.
- [x] **Frontend**: Implementar modal o input de archivo oculto para seleccionar el .xlsx.
- [x] **Frontend**: Lógica para convertir a Base64 y llamar a `invService.importar`.
- [x] **Frontend**: Manejo de errores y confirmación de éxito.

## 3. Estado Final
- [x] Validar flujo completo: Planificar Tarea -> Crear OT vinculada -> Carga de materiales via Excel (opcional para stock inicial).
