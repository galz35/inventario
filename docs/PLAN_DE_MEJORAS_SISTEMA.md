# Plan de Mejoras y Correcciones del Sistema

Este documento organiza los comentarios y notas de prueba del usuario sobre el estado actual del sistema, priorizando correcciones de errores, mejoras de usabilidad y nuevas funcionalidades.

## 1. Gestión de Proyectos (Prioridad Alta - Bug)
**Problema:** Fallo en la carga de proyectos y sus tareas.
**Acción:**
- Investigar el error en la carga de proyectos.
- Verificar la relación Proyecto -> Tareas.
- Asegurar que la vista de detalle del proyecto renderice correctamente.

## 2. Inventario: Ingreso por Proveedor (Prioridad Alta - Usabilidad)
**Problema:** El ingreso actual es "flojo" (tedioso), utiliza un popup por producto individual.
**Solución: Maestro-Detalle.**
- Implementar una interfaz de carga masiva (Maestro-Detalle).
- Permitir agregar múltiples productos en una sola vista (Grid/Tabla) antes de guardar.
- Facilitar la entrada de datos para facturas/remitos de proveedores.

## 3. Backlog y Asignación de Órdenes (Nueva Funcionalidad)
**Problema:** No existe un backlog centralizado. Actualmente se depende de Excel manual para cargar y asignar.
**Solución:**
- Crear módulo de **Backlog de Órdenes de Trabajo**.
- Funcionalidad para **Importar desde Excel** (carga masiva de órdenes).
- Herramienta de asignación de órdenes a técnicos desde el sistema.

## 4. Reportes (Nueva Funcionalidad)
**Problema:** Necesidad de generar reportes de trabajo en formato físico/digital formal.
**Solución:**
- Implementar generación de PDF para los reportes de trabajo.
- Incluir detalles de tarea, técnico, fecha, y estado.

## 5. Activos Fijos y Herramientas (Mejora de UX)
**Problema:** La vista de herramientas muestra "todo" por defecto, lo cual es ineficiente.
**Solución:**
- Cambiar la vista predeterminada a un modo de "Búsqueda" o implementar filtros más agresivos al inicio.
- Evitar cargar toda la lista si no es necesario (paginación o lazy loading).

## 6. Vehículos (Mejora de UX/Funcionalidad)
**Problema:** El módulo está "muy crudo" (básico/incompleto).
**Solución:**
- Revisar y refinar la interfaz de Vehículos.
- Agregar campos necesarios y mejorar el flujo de gestión (asignación, estado, mantenimiento).

---
**Próximos Pasos Recomendados:**
1. Diagnosticar y corregir el fallo en **Carga de Proyectos**.
2. Diseñar e implementar la vista **Maestro-Detalle para Inventario**.
3. Implementar la **Importación de Excel** para el Backlog.