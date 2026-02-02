# 🔍 Reporte de Revisión del Sistema - INVCORE

Este documento detalla el estado actual de cada módulo del sistema, verificando si cumplen con los requisitos de facilidad de uso (estilo Excel), visibilidad de historial y funcionamiento del API.

---

## 📅 1. Planificación (WBS / Proyectos)
*   **Estado Visual:** ⚠️ **Regular**. Usa un diseño de listas a la izquierda y árbol a la derecha. No cumple con el "estilo Excel" solicitado para la lista de proyectos.
*   **Funcionalidad:**
    *   [ ] Tabla compacta con filtros por columna.
    *   [ ] Exportación a Excel/CSV.
    *   [ ] Historial/Auditoría visible por proyecto.
*   **API Endpoints:**
    *   `GET /inv/planificacion/proyectos`: Funcionando (Query directa a DB).
    *   `POST /inv/planificacion/tarea`: Funcionando (SP `Inv_sp_proyecto_tarea_crear`).
    *   `GET /inv/planificacion/proyectos/:id/wbs`: Funcionando.
*   **Observaciones:** Falta convertir la selección de proyectos a una tabla filtrable y añadir una pestaña de historial para ver quién modificó el plan de trabajo.

## 🛠️ 2. Operaciones (Casos / OTs)
*   **Estado Visual:** ✅ **Excelente**. Recientemente actualizado a tablas compactas con filtros por columna y exportación.
*   **Funcionalidad:**
    *   [x] Tabla compacta con filtros.
    *   [x] Exportación a Excel (CSV).
    *   [x] Pestaña de Historial en Modal de detalle.
*   **API Endpoints:**
    *   `GET /inv/operaciones/ot`: Funcionando.
    *   `POST /inv/operaciones/ot/:id/cerrar`: Funcionando.
    *   `POST /inv/operaciones/ot/:id/consumo`: Funcionando.
*   **Observaciones:** Se requiere estandarizar el componente "DataTable" para que la exportación sea nativa y no manual en cada vista.

## 📦 3. Inventario (Stock y Movimientos)
*   **Estado Visual:** 🟢 **Bueno**. Usa `DataTable` pero requiere ajustes de uniformidad.
*   **Funcionalidad:**
    *   [x] Tabla con filtros (vía `DataTable`).
    *   [ ] Botón de exportar a Excel global.
    *   [x] Historial de Kardex disponible por ítem.
*   **API Endpoints:**
    *   `GET /inv/inventario/stock`: Funcionando.
    *   `GET /inv/inventario/kardex`: Funcionando.
    *   `POST /inv/inventario/importar`: Funcionando (Excel).
*   **Observaciones:** La visibilidad del Kardex es buena, pero falta el botón de exportación rápida en la tabla de stock principal.

## 🚚 4. Transferencias (Traslados)
*   **Estado Visual:** ⚠️ **Pendiente**. Actualmente es un formulario de envío sin historial visible.
*   **Funcionalidad:**
    *   [ ] Lista de transferencias en tabla.
    *   [ ] Historial de quién envió y quién recibió.
*   **API Endpoints:**
    *   `POST /inv/inventario/transferencia/enviar`: **CORREGIDO** (Error de `idUsuarioEnvia` resuelto).
    *   `POST /inv/inventario/transferencia/confirmar`: Funcionando.
*   **Observaciones:** Se debe añadir la tabla de historial de traslados para que el usuario sepa dónde está su material.

## 🛰️ 5. Activos (Equipos Serializados)
*   **Estado Visual:** 🟢 **Bueno**.
*   **Funcionalidad:**
    *   [x] Tabla con filtros.
    *   [ ] Historial de asignaciones visible (quién tuvo el router antes).
*   **API Endpoints:**
    *   `GET /inv/activos`: Funcionando.
    *   `POST /inv/activos/asignar`: Funcionando.
*   **Observaciones:** Falta la pestaña de "Trazabilidad" en el detalle del activo.

---

## 🚀 Próximas Acciones (Plan de Mejora):
1.  **Uniformizar `DataTable`**: Añadir soporte nativo para **exportación a Excel** dentro del componente compartido.
2.  **Refactorizar `PlanificacionView`**: Convertir la selección de proyectos a tabla "Excel style" y añadir historial.
3.  **Historial Global**: Crear un endpoint/vista de auditoría centralizada para ver "Todo lo que ha pasado en la empresa" en una sola tabla (Logs).
