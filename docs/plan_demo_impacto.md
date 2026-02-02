# Plan de Trabajo V3: Consolidación Empresarial

## Estado del Proyecto (Estadística de Progreso)
| Módulo | Característica | Importancia | Estado | Notas |
| :--- | :--- | :--- | :--- | :--- |
| **Generales** | Estética Premium | Alta | ✅ Completo | UI moderna con Lucide/Recharts |
| **Inventario** | Reportes PDF (Auditoría) | **Crítica** | ✅ Completo | Genera valorización y stock |
| **Inventario** | Kardex Visual (Rastreo) | **Crítica** | ✅ Completo | Entradas/Salidas coloreadas y usuario |
| **Inventario** | Alertas Stock Bajo | Alta | ✅ Completo | Banner visible en cabecera |
| **Inventario** | UX/Filtros Rápidos | Media | ✅ Completo | Chips de filtros y buscador avanzado |
| **Operaciones** | Cierre con Firma + PDF | **Crítica** | ✅ Completo | Ciclo legal cerrado |
| **Operaciones** | Tablero Kanban | Alta | ✅ Completo | Vista Tablero vs Lista funcional |
| **Proyectos** | Control Financiero | Media | ✅ Completo | Dashboard Presupuesto vs Real |
| **Sistema** | Build & Deploy | Alta | ✅ Completo | Errores de sintaxis corregidos |

---

## Misión de Demo: CUMPLIDA
El sistema cuenta ahora con los 3 pilares necesarios para cerrar una venta B2B:
1.  **Confianza:** Auditoría, Kardex y PDFs.
2.  **Control:** Tablero Kanban para operaciones de campo.
3.  **Rentabilidad:** Visibilidad financiera en proyectos.

---

## Prioridades Ordenadas (Hoja de Ruta Futura)

### 1. Terminación de UX Inventario (Inmediato)
*Objetivo: Que el sistema sea rápido de usar para el operario diario.*
- [ ] **Filtros Rápidos (Chips):** Implementar botones `[Bajo Stock]`, `[Más Movidos]`, `[Sin Stock]` encima de la tabla para filtrar sin tipear.
- [ ] **Buscador Avanzado:** Asegurar que busque por SKU, Nombre y Categoría simultáneamente.

### 2. Tablero de Comando Operativo (Kanban)
*Objetivo: Que el Gerente de Operaciones vea todo el panorama en un pantallazo.*
- [ ] **Vista de Tablero:** Crear una nueva vista en Operaciones que muestre columnas: `Pendiente` -> `En Proceso` -> `Por Cerrar` -> `Finalizado`.
- [ ] **Drag & Drop (Opcional por ahora):** Al menos visualizar las tarjetas; moverlas puede ser fase posterior si hay complejidad técnica, pero la visualización es clave.

### 3. Inteligencia de Proyectos (Fase Financiera)
*Objetivo: Responder "¿Estoy ganando o perdiendo dinero en este proyecto?".*
- [ ] **Dashboard de Proyecto:** Mostrar gráfico de barras: Presupuesto Estimado vs. Costo Real (Materiales + Mano de Obra).

---

## Instrucciones de Ejecución
1. **Proceder con Puntos 1.1 y 1.2 (Inventario)** para cerrar el módulo de Inventario como "Terminado y Profesional".
2. **Saltar a Punto 2 (Kanban)** para elevar el nivel visual de Operaciones.
3. **Finalizar con Punto 3** para dar el toque gerencial financiero.
