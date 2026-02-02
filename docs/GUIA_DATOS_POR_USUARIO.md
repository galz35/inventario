# Datos y Visibilidad por Usuario - INVCORE

Este documento define la fuente de datos real y qué información específica debe visualizar cada perfil en las pantallas funcionales del sistema.

## 1. Módulo: Inventario (`InventarioView.tsx`)
*   **Fuente de Datos:** Tabla `Inv_inventario_stock` mediante `invService.getStock()`.
*   **Administrador:**
    *   **Vista:** Consolidado de todos los depósitos (Nacional).
    *   **Datos:** Stock total, propietario (Empresa/Consignación) y costos integrados.
*   **Encargado Bodega (Almacén):**
    *   **Vista:** Filtrada automáticamente por su `idAlmacen` (obtenido del profile de login).
    *   **Datos:** Solo productos bajo su custodia física. Capacidad de iniciar trasferencias.
*   **Técnico:**
    *   **Vista:** Stock dentro de su camioneta asignada (`idAlmacenTecnico`).
    *   **Datos:** Únicamente materiales cargados para sus OTs del día.

## 2. Módulo: Gestión de OTs (`OperacionesView.tsx`)
*   **Fuente de Datos:** Tabla `Inv_ope_ot` mediante `invService.getOTs()`.
*   **Supervisor:**
    *   **Vista:** Todas las OTs del proyecto o región asignada.
    *   **Datos:** ID de OT, Cliente (Nombre/DNI), Estado, Técnico Asignado, Prioridad.
    *   **Acciones:** Crear OTs, Asignar Técnicos (Realiza un `POST` que crea la relación comercial).
*   **Técnico:**
    *   **Vista:** Únicamente OTs donde `idTecnico === user.idUsuario`.
    *   **Datos:** Dirección del cliente, descripción técnica, lista de materiales a usar.
    *   **Acciones:** "Cerrar OT" (Provoca el consumo de inventario real en `Inv_inventario_stock`).

## 3. Módulo: Planificación WBS (`PlanificacionView.tsx`)
*   **Fuente de Datos:** Tabla `Inv_ope_proyectos` y `Inv_ope_wbs_tareas`.
*   **Administrador / Auditor:**
    *   **Vista:** Comparativa Presupuesto vs Real (Análisis de costos).
    *   **Datos:** Margen de rentabilidad, materiales excedidos.
*   **Supervisor:**
    *   **Vista:** Estructura de desglose del trabajo (Árbol de tareas).
    *   **Datos:** Duración estimada, materiales reservados por tarea.
    *   **Acciones:** Crear la jerarquía de tareas para ejecución técnica.

## 4. Módulo: Catálogos Maestros (`CatalogosView.tsx`)
*   **Fuente de Datos:** Tablas `Inv_cat_productos`, `Inv_cat_proveedores`, `Inv_cat_categorias`.
*   **Administrador:**
    *   **Vista:** Full edición (CRUD).
    *   **Datos:** Precios de compra, NIT de proveedores, configuración de si un item es Serializado o Consumible.
*   **Otros Roles:**
    *   **Acceso:** Restricted (Bloqueado por `RolesGuard` en backend). Solo lectura en dropdowns de selección.

---

### 🚨 Auditoría de Datos "Quemados" Detectados:
1.  **Imágenes de Evidencia:** En `OperacionesView.tsx`, las evidencias son temporales. Se debe persistir la URL devuelta por `storage.service.ts`.
2.  **Firma Digital:** Actualmente el componente Modal lo simula; falta integrar el canvas de firma real para técnicos.
3.  **WBS:** El botón "Nueva Tarea" actualmente lanza una alerta; se requiere implementar el formulario que envíe a `invService.crearTarea`.

**Estado de Integración:** 85% Funcional. Las consultas a `Inventario`, `Catalogos` y `OTs` ya consumen la base de datos SQL real mediante el `api.service.ts`.
