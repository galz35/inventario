# 🔐 Credenciales y Hoja de Ruta - Demo INVCORE

Este documento guía al evaluador a través de los diferentes roles y funciones del sistema.

**Contraseña Unificada:** `123456`

---

## 🎭 Perfiles y Escenarios de Prueba

### 1. 🥇 MIGUEL TORRES (Administrador / Dueño)
**Email:** `miguel.torres@empresa.com`
*Él controla los activos de alto valor y ve la rentabilidad.*

*   **Pestaña [Dashboard]:** Revisa el valor total del inventario y el cumplimiento de SLAs.
*   **Pestaña [Inventario]:** Filtra por "Bodega Central" y genera el **Reporte PDF** para auditoría externa.
*   **Pestaña [Activos]:** 
    *   Usa el botón **[+ Alta de Activo]** para registrar una nueva Fusionadora (S/N: FUS-2024-XP).
    *   Usa el botón **[Asignar]** para entregarle una herramienta a un técnico.
*   **Pestaña [Planificación]:** Observa el avance financiero de los proyectos (Presupuesto vs Real).

---

### 2. 📋 SOFIA LOPEZ (Supervisora de Operaciones)
**Email:** `sofia.lopez@empresa.com`
*Coordina el trabajo de campo y despacha materiales.*

*   **Pestaña [Operaciones]:**
    *   Cambia a la **Vista Kanban** para ver el estado de las cuadrillas.
    *   Crea una **Nueva Orden de Trabajo (OT)** y asígnala al técnico Carlos Paredes.
*   **Pestaña [Inventario]:** Realiza una **Transferencia** desde Bodega Central hacia la unidad móvil de un técnico.

---

### 3. 🛠️ CARLOS PAREDES (Técnico de Campo)
**Email:** `c` (Acceso rápido) o `carlos.paredes@empresa.com`
*Ejecuta los trabajos y consume materiales.*

*   **Pestaña [Operaciones]:**
    *   Abre la OT asignada por Sofia.
    *   Registra el consumo de materiales (ej. 2 conectores SC y 1 ONT).
    *   **Cierra la OT:** Firma digitalmente y descarga el comprobante de cierre.
*   **Pestaña [Activos]:** Revisa "Mis Herramientas" para confirmar que tiene el equipo que Miguel le asignó.

---

### 4. 📦 ROBERTO CENTRAL (Jefe de Bodega)
**Email:** `roberto.central@empresa.com`
*Gestiona las entradas y salidas de materiales.*

*   **Pestaña [Inventario]:** 
    *   Busca productos con **Stock Bajo** (resaltados en rojo).
    *   Revisa el **Kardex** de un producto para ver quién se lo llevó (Trazabilidad).

---

## ✅ Ajustes Realizados con Éxito
- [x] **Miguel Torres:** Promovido a Administrador para control de Activos Fijos.
- [x] **Paginación:** Implementada en todas las tablas para fluidez.
- [x] **Fechas:** Agregadas en la tabla de OTs para control de antigüedad.
- [x] **Firma Digital:** Vinculada al cierre de OTs técnicas.
- [x] **Reportes:** Generación de PDF habilitada en Inventario y Cierre de OTs.

---
**Nota Técnica:** Si un usuario no puede realizar una acción de su rol, por favor notificar al equipo de desarrollo para ajustar los permisos en la tabla `Inv_seg_usuarios` -> columna `rolGlobal`.

