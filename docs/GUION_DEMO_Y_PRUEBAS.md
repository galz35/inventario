# Protocolo de Pruebas Funcionales (UAT)
**Proyecto:** Plataforma de Gestión de Inventario y Operaciones
**Fecha:** 31 de Enero 2026
**Propósito:** Validar técnicamente el cumplimiento de los requerimientos funcionales solicitados.

---

## 1. Prerequisitos del Entorno
*   **Servidor Backend:** Debe estar en ejecución (Puerto 3000 activo).
*   **Cliente Frontend:** Debe estar accesible vía navegador (Puerto 5173).
*   **Base de Datos:** Debe contener datos semilla (al menos 1 proyecto, 5 productos, 2 usuarios activos).

---

## 2. Matriz de Usuarios y Roles para Pruebas
Si no dispone de las credenciales exactas, utilice usuarios que tengan los siguientes permisos configurados en base de datos:

| Rol de Prueba | Permisos Clave | Módulos Accesibles | Validación Principal |
| :--- | :--- | :--- | :--- |
| **ADMINISTRADOR** | Acceso Total | Dashboard, Inv, Ops, Proyectos | Inteligencia de Negocios y Finanzas |
| **SUPERVISOR** | Gestión de OTs | Operaciones (Kanban) | Flujo de trabajo y Asignación |
| **TÉCNICO** | Ver Propias OTs | Operaciones (Móvil) | Cierre, Firma y Evidencia |
| **BODEGA** | Gestión Stock | Inventario | Trazabilidad y Auditoría |

---

## 3. Escenarios de Prueba Detallados

### BLOQUE A: INVENTARIO Y AUDITORÍA
**Actor:** Usuario con rol de Bodega o Admin.

**Prueba INV-01: Filtrado Inteligente y Búsqueda**
*   **Objetivo:** Verificar velocidad y precisión en la localización de ítems.
*   **Pasos:**
    1.  Ingresar al módulo **Inventario**.
    2.  En la barra de búsqueda escribir un término parcial (ej: "Fibra" o "Conector").
    3.  Hacer clic en el filtro rápido (chip) **"Bajo Stock"**.
    4.  Hacer clic en el filtro rápido **"Alto Valor"**.
*   **Resultado Esperado:** La tabla debe actualizarse en menos de 1 segundo. Al activar "Bajo Stock", solo deben aparecer ítems con stock < mínimo.

**Prueba INV-02: Trazabilidad (Kardex)**
*   **Objetivo:** Validar que cada movimiento deje huella.
*   **Pasos:**
    1.  Identificar un producto en la tabla.
    2.  Hacer clic en la fila del producto para expandir detalles (o botón "Ver").
    3.  Ir a la pestaña/sección **"Historial de Movimientos"**.
*   **Resultado Esperado:** Visualizar tabla cronológica. Entradas en verde, Salidas en rojo. Debe mostrar **Usuario**, **Fecha** y **Cantidad** exacta.

**Prueba INV-03: Generación de Reporte PDF**
*   **Objetivo:** Generar entregable físico para auditoría.
*   **Pasos:**
    1.  Aplicar cualquier filtro (ej: Almacén Principal).
    2.  Hacer clic en el botón **"Reporte PDF"** (Icono de documento).
*   **Resultado Esperado:** Descarga automática de archivo `.pdf`. El documento debe contener: Logo, Fecha Actual, Lista filtrada y **Valorización Total** (suma de dinero).

---

### BLOQUE B: OPERACIONES DE CAMPO
**Actor:** Usuario Técnico.

**Prueba OPS-01: Validación de Seguridad (Checklist)**
*   **Objetivo:** Asegurar cumplimiento de normativas antes del trabajo.
*   **Pasos:**
    1.  Ir al módulo **Operaciones**.
    2.  Abrir una Orden de Trabajo (OT) asignada (Estado: Pendiente/Asignada).
    3.  Intentar hacer clic directamente en **"Finalizar Orden"** sin tocar nada más.
*   **Resultado Esperado:** El sistema **DEBE BLOQUEAR** la acción y mostrar mensaje de error: "Debe completar checklist...".

**Prueba OPS-02: Cierre con Firma Digital**
*   **Objetivo:** Capturar conformidad del cliente.
*   **Pasos:**
    1.  En la misma OT, marcar todos los checks (EPP, Seguridad, etc.).
    2.  En el área de "Firma del Cliente", dibujar un trazo con el mouse o dedo (si es táctil).
    3.  Hacer clic en **"Finalizar Orden"**.
*   **Resultado Esperado:**
    1.  La orden se cierra (desaparece de pendientes o cambia estado).
    2.  Se descarga **automáticamente** un PDF.
    3.  Al abrir el PDF, la firma dibujada debe aparecer en la sección de "Conformidad".

---

### BLOQUE C: SUPERVISIÓN Y CONTROL
**Actor:** Supervisor o Admin.

**Prueba SUP-01: Tablero Kanban**
*   **Objetivo:** Visualización de flujo de trabajo.
*   **Pasos:**
    1.  Ir al módulo **Operaciones**.
    2.  Localizar el control de vistas (Arriba a la derecha) y seleccionar **"Tablero"**.
*   **Resultado Esperado:** La vista de lista desaparece. Se muestran columnas visuales (Pendiente / En Progreso / Finalizada). Las tarjetas muestran resumen de la OT.

**Prueba SUP-02: Dashboard Financiero de Proyecto**
*   **Objetivo:** Control de costos.
*   **Pasos:**
    1.  Ir al módulo **Planificación / Proyectos**.
    2.  Observar las tarjetas superiores.
*   **Resultado Esperado:** Visualizar indicadores de **"Presupuesto Estimado"** vs **"Costo Real"**. Los valores deben ser numéricos y legibles (formato moneda).

---

## 4. Notas para el Tester
*   Si encuentra un error de "Conexión rechazada", verifique que el backend esté corriendo.
*   Los reportes PDF se generan en el cliente (Browser), no requieren internet para generarse, pero sí datos del backend.
*   La firma digital soporta dispositivos táctiles (iPad/Tablet Android) y Mouse.
