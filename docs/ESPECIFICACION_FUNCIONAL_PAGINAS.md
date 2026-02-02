# Especificación Funcional de Páginas e Interacciones - INVCORE

Este documento define el comportamiento esperado, flujo de datos y lógica de cada botón para asegurar que el sistema sea 100% funcional y no solo visual.

---

## 1. Dashboard (Panel Principal)
*   **Usuarios:** Todos (Vista adaptativa por rol).
*   **Datos:**
    *   **Admin:** KPIs globales de valor de inventario, OTs críticas y cumplimiento de SLA.
    *   **Técnico:** Resumen de sus OTs del día y estado de su stock en camioneta.
    *   **Bodeguero:** Alertas de stock bajo en su bodega y transferencias confirmadas.
*   **Botones y Acciones:**
    *   **Tarjetas de Estadísticas:** Al hacer clic, redirigen a la vista detallada correspondiente (ej: clic en OTs -> va a Órdenes OT).
    *   **Botonera de Acciones Rápidas:** Atajos directos a funciones frecuentes (Nueva OT, Ver Stock, etc.).
    *   **Lista de Actividad:** Muestra los últimos 10 movimientos vinculados al usuario logueado.

---

## 2. Inventario (`InventarioView.tsx`)
*   **Usuarios:** Admin (Todo), Bodeguero (Su bodega), Técnico (Su camioneta).
*   **Datos:** Tabla de stock actual (Producto, Código, Cantidad, Almacén, Propietario).
*   **Botones y Acciones:**
    *   **Refrescar Stock:** Ejecuta `invService.getStock()` nuevamente para actualizar datos.
    *   **Notificar Stock Bajo (Admin/Bodeguero):** Dispara un envío de correo vía API (`invService.notificarStockBajo`) a los responsables.
    *   **Ver Historial (Kardex):** Abre un Modal que consulta `invService.getKardex(almacenId, productoId)` mostrando entradas, salidas y saldos históricos.
*   **Flujo:** El usuario filtra por nombre -> Encuentra el item -> Abre Kardex para auditar movimientos -> Refresca si es necesario.

---

## 3. Órdenes de Trabajo (`OperacionesView.tsx`)
*   **Usuarios:** Supervisor (Asigna), Técnico (Ejecuta).
*   **Datos:** Cards con ID de OT, Cliente, Dirección, Estado, Técnico y Prioridad.
*   **Botones y Acciones:**
    *   **Crear Nueva OT (Supervisor):** Abre formulario para ingresar Cliente, Proyecto y Tipo de Trabajo. Backend: `POST /inv/operaciones/ot`.
    *   **Finalizar Trabajo (Técnico):** Cambia el estado a 'FINALIZADA'. Backend: `POST /inv/operaciones/ot/:id/cerrar`. **Impacto:** Bloquea la edición de la OT.
    *   **Cámara (Antes/Después):** Abre la interfaz de cámara del dispositivo. Al capturar, envía Base64 al servidor para almacenamiento en File System y DB.
*   **Flujo:** Supervisor crea OT -> Técnico la recibe en su cel -> Técnico llega al sitio -> Toma fotos -> Registra materiales (se descuentan de su stock) -> Firma del cliente -> Cierra OT.

---

## 4. Plan de Trabajo / WBS (`PlanificacionView.tsx`)
*   **Usuarios:** Supervisor, Admin.
*   **Datos:** Lista de proyectos activos y árbol jerárquico de tareas.
*   **Botones y Acciones:**
    *   **Nueva Tarea:** Abre modal para crear tarea hija o raíz. Backend: `POST /inv/planificacion/tarea`.
    *   **Estimar (Caja):** Abre catálogo para seleccionar materiales necesarios para esa tarea específica. Backend: `POST /inv/planificacion/material-estimado`.
*   **Flujo:** Seleccionar Proyecto -> Visualizar tareas -> Desglosar nueva tarea técnica -> Asignar lista de materiales necesarios para presupuesto.

---

## 5. Catálogos Maestros (`CatalogosView.tsx`)
*   **Usuarios:** Admin (Escritura), Otros (Lectura si aplica).
*   **Datos:** Gestión de Productos, Proveedores y Categorías.
*   **Botones y Acciones:**
    *   **Nuevo [Item]:** Formulario dinámico según la pestaña activa. Graba directamente en SQL.
    *   **Switch Serializado:** Define si el producto requiere control por No. de Serie (Activo) o es granel (Consumible).
*   **Flujo:** Admin crea Categoría -> Crea Proveedor -> Registra Producto vinculado a ambos.

---

## 6. Almacenes y Bodegas (`AlmacenesView.tsx`)
*   **Usuarios:** Admin.
*   **Datos:** Lista de almacenes (Central, Proyecto, Técnico, Regional).
*   **Botones y Acciones:**
    *   **Nuevo Almacen:** Crea la entidad y la vincula a un responsable si es tipo 'Técnico'.
*   **Flujo:** Definir la red logística del sistema para que el inventario sepa dónde estar.

---

## 7. Control de Consignación (`ConsignacionView.tsx`)
*   **Usuarios:** Admin, Almacén.
*   **Datos:** Material ingresado que aún pertenece al proveedor.
*   **Acciones:** Liquidar material usado (Pasar de 'Consignación' a 'Empresa' tras pago).
