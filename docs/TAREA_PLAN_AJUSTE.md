# 📋 Plan de Tareas y Ajustes - Sistema INVCORE

Este documento registra la revisión detallada de cada módulo y el plan de acción para cumplir con los estándares de **"Estilo Excel"** (Tablas compactas, filtros, exportación) y **"Visibilidad de Historial"** (Trazabilidad de cambios).

---

## 🛠️ Estado de la Revisión por Módulo

### 1. 📦 Inventario (Stock y Movimientos)
*   **Estado:** ✅ **Completado**.
*   **Ajustes realizados:**
    *   Habilitada la exportación nativa a Excel (CSV).
    *   Filtros dinámicos por almacén y propietario.
    *   Acceso rápido a Kardex (Historial de movimientos por ítem).

### 2. 🛠️ Operaciones (OTs)
*   **Estado:** ✅ **Completado**.
*   **Ajustes realizados:**
    *   Refactorizado de Cards a Tabla Compacta (Estilo Excel).
    *   Filtros por ID, Cliente, Técnico, Estado y Prioridad.
    *   Pestaña de Historial añadida al modal de detalle (Audit Log).
    *   Lógica de registro de materiales simplificada.

### 🏗️ 3. Planificación (WBS / Proyectos)
*   **Estado:** ✅ **Completado**.
*   **Ajustes realizados:**
    *   Lista de proyectos convertida a `DataTable` con filtros.
    *   Añadida pestaña de Historial de cambios para el WBS.
    *   Botón para volver a la lista mejorado.

### 🛰️ 4. Activos (Equipos Serializados)
*   **Estado:** ⚠️ **En Proceso**.
*   **Pendientes:**
    *   [ ] Crear modal de detalle de activo (para ver historial de quién lo tuvo).
    *   [ ] Endpoint en backend para obtener trazabilidad por número de serie.
    *   [ ] Botón de exportación verificado.

### 📚 5. Catálogos (Productos, Proveedores, Categorías)
*   **Estado:** 🟢 **Bueno**.
*   **Pendientes:**
    *   [ ] Uniformizar el título dentro de `DataTable`.
    *   [ ] Añadir botón de "Modificar" en la tabla para edición rápida.

### 📈 6. Inteligencia de Negocio (Reportes)
*   **Estado:** ⚠️ **Pendiente Ajuste**.
*   **Pendientes:**
    *   [ ] Migrar tablas manuales a `DataTable` para ganar filtros y exportación automática.
    *   [ ] Añadir filtros por fecha globales.

---

## 🚀 Plan de Ajuste Inmediato (Próximas 2 horas)

1.  **Estandarización de Reportes:** Reemplazar las tablas de `ReportesView.tsx` por `DataTable`.
2.  **Trazabilidad de Activos:** Implementar en el backend la consulta `Inv_sp_activo_historial_obtener` y mostrarla en el frontend.
3.  **Registro Global de Actividad:** Crear una nueva vista `/app/logs` que consuma una tabla de auditoría general (si existe en base) o que agrupe los movimientos más importantes del sistema.
4.  **Consolidación de Layout:** Asegurar que todas las cabeceras de página tengan el mismo margen y tamaño de fuente (2.5rem 900).

---

## 📝 Registro de Cambios Recientes
- **2026-01-30:** Unificación de `DataTable` con soporte de exportación CSV.
- **2026-01-30:** Refactorización de `OperacionesView` y `PlanificacionView`.
- **2026-01-30:** Corrección de error de `NULL` en Transferencias.
