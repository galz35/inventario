# Plan de Implementación: Gestión Avanzada de Proveedores y Reportes Técnicos

## 1. Visión General
El objetivo es centralizar la gestión de proveedores ("Página de Proveedor 360") y mejorar la trazabilidad de materiales usados por técnicos, con énfasis en productos consignados. Se eliminarán vistas redundantes si es necesario.

## 2. Nueva Estructura Propuesta

### A. Módulo de Proveedores (Nuevo/Refactorizado)
**Ruta:** `/proveedores` o `/consignacion/proveedores`
**Funcionalidades:**
1.  **Selector de Proveedor:** Buscador rápido.
2.  **Dashboard del Proveedor (360°):**
    *   **Entradas Recientes:** Historial de recepciones.
    *   **Stock Consignado Actual:** Lo que tenemos en bodega propiedad de ellos.
    *   **Deuda Pendiente:** Consumos no pagados.
    *   **Historial de Liquidaciones:** Pagos realizados.
    *   **Devoluciones/Cambios:** Registro de devoluciones o ajustes.

### B. Reporte de Consumo Técnico (Diario y Por Proyecto)
**Ruta:** `/reportes/consumo-tecnico`
**Funcionalidades:**
1.  **Filtros:** Técnico, Fecha (Día), Proyecto.
2.  **Vista "Caso del Día":**
    *   Lista de OTs atendidas.
    *   Materiales usados en cada OT.
    *   **Destacado:** Identificación clara de materiales *CONSIGNADOS* usados (clave para la liquidación).
3.  **Resumen por Proyecto:** Total de materiales imputados a un proyecto específico.

## 3. Checklist de Implementación

### Fase 1: Backend & Base de Datos
- [ ] **API Reporte Técnico:** Crear endpoint `GET /reportes/tecnico-diario` que devuelva OTs y consumos detallados, marcando si el item es consignado.
- [ ] **API Proveedor 360:** Crear endpoint `GET /proveedores/:id/resumen` que agrupe stock, deuda y movimientos.
- [ ] **Consultas:** Optimizar consultas SQL para unir `Inv_ope_ot_consumos`, `Inv_cat_productos` (campo propietario) y `Inv_ope_inv_stock`.

### Fase 2: Frontend - Vista Proveedor 360
- [ ] **Crear `ProveedorProfileView.tsx`:**
    *   Header con datos del proveedor.
    *   Tabs: "Stock Actual", "Entradas", "Deuda/Liquidaciones".
- [ ] **Integrar en `ConsignacionView`:** Posiblemente mover la lógica actual de consignación a esta vista más completa o enlazarla.

### Fase 3: Frontend - Reportes
- [ ] **Crear `ReporteTecnicoView.tsx`:**
    *   Tabla de técnicos con resumen diario.
    *   Detalle expandible: OTs del día -> Materiales.
    *   Indicador visual (Badge "Consignado") para materiales de terceros.

### Fase 4: Limpieza
- [ ] Revisar si la vista actual de `ConsignacionView` (pestaña Stock) se vuelve redundante con el nuevo perfil de proveedor, o si deben fusionarse.
- [ ] Eliminar componentes no utilizados.

## 4. Archivos Afectados
- `backend/src/inv_modules/reportes/reportes.controller.ts` (Nuevo endpoint)
- `backend/src/inv_modules/reportes/reportes.repo.ts` (Nuevas queries)
- `frontend/src/modules/proveedores/ProveedorProfileView.tsx` (Nueva vista)
- `frontend/src/modules/reportes/ReporteTecnicoView.tsx` (Nueva vista)

---
**Nota:** "Inventario vamos bien". Se mantendrá la estabilidad del inventario actual.
