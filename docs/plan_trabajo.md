# Plan de Implementación — Sistema de Inventario y OT

Este documento detalla la hoja de ruta técnica para la construcción del sistema, asegurando que la base sea sólida y escalable.

## 1. Fase de Cimientos (Semana 1 - El Core)
Objetivo: Tener la base de datos, autenticación y la estructura de carpetas lista.

### DB & Backend Core
- [x] Crear Script `Inv_Schema.sql` con todas las tablas detalladas en el documento principal (Prefijo `Inv_`).
- [x] Implementar Procedimientos de Seguridad (`Inv_sp_auth_login`, `Inv_sp_auth_refresh`).
- [x] Configurar NestJS para usar el nuevo esquema sin borrar lo anterior por ahora (Aislamiento).
- [x] Crear el `BaseRepo` optimizado para el nuevo esquema.

### Frontend Baseline
- [x] Inicializar Proyecto Vite + React + TypeScript.
- [x] Definir el Design System (CSS Variables: Gris/Negro/Blanco + Rojo + Verde).
- [x] Crear Layout Principal (Sidebar, Navbar, Mobile Menu).
- [x] Configurar servicios base (API Client, Auth Provider).

## 2. Fase de Catálogos y Almacenes
Objetivo: Poder registrar dónde y qué materiales existen.

- [x] CRUD de Proveedores y Categorías (vía SP).
- [x] Gestión de Almacenes (incluyendo jerarquía Almacén Padre -> Sub-almacén).
- [x] Catálogo de Productos (Consumibles vs Serializados).

## 3. Fase de Inventario y Movimientos (Módulo Crítico)
Objetivo: Control de stock real.

- [x] Implementar `Inv_sp_inv_movimiento_registrar` (Corazón del Kardex).
- [x] Pantalla de Stock por Almacén con filtros avanzados.
- [x] Flujo de Transferencias entre Almacenes (Crear -> Confirmar).

## 4. Fase de Operaciones (OT y Proyectos)
Objetivo: El trabajo en campo.

- [x] Gestión de Proyectos (Agrupador).
- [x] Creación y Asignación de OT.
- [x] Flujo Móvil: Consumo de materiales en OT y toma de evidencias.

## 5. Fase de Activos y Control
Objetivo: Equipos serializados y auditoría.

- [x] Gestión de Activos (Asignación a técnico/cliente).
- [x] Reparaciones y Bajas.
- [x] Módulo de Conteo Físico.

## 6. Fase de Consignación
- [x] Cálculo de liquidaciones por proveedor.
- [x] Procesamiento de pagos y cierre de periodos.

## 7. Fase de Reportes Avanzados
- [x] Reportes de Consumo (OT, Técnico, Proyecto).
- [x] Reportes de SLA y Cumplimiento.
- [x] Dashboard de Stock Crítico.

## 8. Hardening y Seguridad
- [x] Auditoría de Slow Queries (Inv_p_SlowQueries).
- [x] Control de concurrencia avanzado (UPDLOCK).
- [x] Reglas de visibilidad por Rol (Admin vs Técnico).

## 9. Fase 10: UAT + Salida
- [x] Generación de Seed Data completo.
- [x] Documentación técnica final.
- [x] Verificación de integridad referencial.

---

## Estructura de Carpetas Propuesta

### Backend (`/backend`)
- `src/inv_modules/`: Módulos específicos del nuevo sistema.
  - `auth/`: Reutilizar lógica actual adaptada al nuevo esquema.
  - `inventario/`: Stock, Kardex, Movimientos.
  - `operaciones/`: Proyectos, OT.
  - `activos/`: Serializados.
- `src/db/`: Mantener el `BaseRepo` y `sqlserver.provider`.

### Frontend (`/frontend`)
- `src/components/ui/`: Componentes básicos con diseño premium.
- `src/modules/`: Lógica por módulos (Inventario, OT, etc.).
- `src/hooks/`: Gestión de estado y llamadas API.
- `src/styles/`: Temas y utilidades CSS.

---

## Checklist de Calidad (DoD)
- [x] Todo SP debe incluir bloque `TRY...CATCH` y transacciones.
- [x] Ninguna consulta de este proyecto debe tocar tablas sin el prefijo `Inv_`.
- [x] Diseño responsivo obligatorio (Prioridad móvil para técnicos).
- [x] El diseño NO debe usar azul.
