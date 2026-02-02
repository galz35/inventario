# Matriz de Accesos y Vistas por Rol - INVCORE

Este documento detalla qué información y funcionalidades tiene permitidas cada rol dentro del sistema, sirviendo como guía para auditoría y pruebas de permisos.

## 1. Administrador (ADMIN)
*   **Perfil:** Dueño total del sistema (ej: `diana.martinez@empresa.com`).
*   **Dashboard:** Resumen global de stock crítico, SLAs de todos los técnicos y proyectos activos.
*   **Vistas Específicas:**
    *   **Catálogos:** Control absoluto de Clientes, Productos, Precios y Usuarios.
    *   **Almacenes:** Gestión de Bodegas Centrales y Camionetas.
    *   **Auditoría:** Ver quién hizo qué, cuándo y desde dónde (Logs de sistema).
    *   **Reportes:** Exportación de KPIs financieros y operativos.
    *   **Inventario:** Ver el stock de **TODOS** los almacenes y realizar ajustes manuales.
    *   **Operaciones:** Crear/Cerrar cualquier OT y Proyecto.

## 2. Bodeguero / Almacenista (ALMACEN)
*   **Perfil:** Responsable de una ubicación física (ej: `roberto.central@empresa.com`).
*   **Dashboard:** Entradas pendientes de proveedores y solicitudes de técnicos.
*   **Vistas Específicas:**
    *   **Inventario:** Solo ve y gestiona el stock de **SU ALMACÉN** asignado (Central Norte, Sur, etc.).
    *   **Transferencias:** Enviar material a técnicos y recibir devoluciones.
    *   **Kardex:** Historial detallado de movimientos de sus productos.
    *   **Consignación:** Gestionar material que aún no se ha pagado al proveedor.

## 3. Supervisor / Despachador (SUPERVISOR)
*   **Perfil:** Gestor de equipos y proyectos (ej: `sofia.lopez@empresa.com`).
*   **Dashboard:** Estado de avance de proyectos y carga de trabajo del personal a cargo.
*   **Vistas Específicas:**
    *   **Planificación (WBS):** Crear tareas de proyectos, estimar materiales y cronogramas.
    *   **Órdenes OT:** Crear OTs y **ASIGNARLAS** a técnicos específicos.
    *   **Reportes SLA:** Monitorear el tiempo de respuesta de los técnicos.
    *   **Inventario:** Consulta global (lectura) para saber si hay stock antes de asignar tareas.

## 4. Técnico de Campo (TECNICO)
*   **Perfil:** Ejecutor en campo (ej: `carlos.paredes@empresa.com`).
*   **Dashboard:** Listado de OTs del día ordenadas por prioridad/distancia. Su inventario actual en la camioneta.
*   **Vistas Específicas:**
    *   **Mi Almacén Móvil:** Solo ve el stock que tiene cargado en su vehículo/mochila.
    *   **Ejecución OT:**
        *   Registrar consumo de materiales (se descuenta de su camioneta).
        *   Subir evidencias fotográficas del trabajo.
        *   Capturar firma digital del cliente.
    *   **Transferencias:** Confirmar recepción de material enviado desde bodega central.

## 5. Auditor / Auditor Proyectos (AUDITOR)
*   **Perfil:** Control de calidad y costos (ej: `elena.rojas@empresa.com`).
*   **Dashboard:** Desviaciones presupuestarias (Material Estimado vs Real).
*   **Vistas Específicas:**
    *   **Auditoría Inventario:** Verificación de movimientos sospechosos o negativos.
    *   **Activos Seriales:** Rastrear equipos específicos (routers, antenas) por su número de serie.
    *   **Reportes:** Solo lectura de todos los indicadores del sistema.

---
**Nota:** El sistema utiliza `RolesGuard` en el Backend. Si un Técnico intenta entrar a una URL de Administrador, el servidor devolverá `403 Forbidden` incluso si conoce la URL.
