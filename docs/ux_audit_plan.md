# Auditoría UX/UI por Página (Web) + Plan de Mejora por Fases

Este documento resume, **página por página**, lo que hace cada vista hoy, **posibles fallas/limitaciones**, y un **plan de mejora** orientado a: **experiencia máxima**, **compatibilidad móvil** y **preparación para React Expo**.  
Todo se basa en el código actual (sin inventar).

---

## 1) AuthView (Login)
**Archivo:** `frontend/src/modules/auth/AuthView.tsx`

**Qué hace hoy**
- Login con correo/carnet y contraseña.
- Guarda token y usuario en `localStorage`.

**Riesgos / Limitaciones**
- No hay validación progresiva ni indicador de requisitos mínimos.
- No hay “recordarme”, ni recuperación de contraseña.

**Mejoras UX**
1) Mensajes de error más claros (credenciales vs red).  
2) Indicador de caps-lock y visibilidad de contraseña.  
3) Opción “recordar sesión” (si es permitido por seguridad).  

**Compatibilidad móvil / Expo**
- UI está basada en inputs HTML simples; requerirá rediseño en RN.

---

## 2) App.tsx (Shell / Navegación)
**Archivo:** `frontend/src/App.tsx`

**Qué hace hoy**
- Control de navegación con `hash` y render condicional.
- Sidebar con secciones por rol.

**Riesgos / Limitaciones**
- Navegación no usa router, lo que dificulta deep links.
- Muchos estilos inline → difícil de migrar a Expo.

**Mejoras UX**
1) Migrar navegación a React Router (web) o navegación unificada.  
2) Centralizar estilos en Design System / tokens.  

**Compatibilidad móvil / Expo**
- Para Expo se requerirá navegación tipo stack/tab (React Navigation).

---

## 3) DashboardView
**Archivo:** `frontend/src/modules/dashboard/DashboardView.tsx`

**Qué hace hoy**
- KPIs, gráficos y actividad reciente.

**Riesgos / Limitaciones**
- Usa datos mock (tendencias) + manejo débil de errores.
- Si APIs fallan, muestra datos vacíos.

**Mejoras UX**
1) Estado de “sin datos” explícito.  
2) Carga skeleton.  
3) Ajustar cards para móviles (1 columna).  

**Compatibilidad móvil / Expo**
- Gráficos con recharts no funcionan en RN; se requiere librería RN.

---

## 4) InventarioView (Stock + Kardex)
**Archivo:** `frontend/src/modules/inventario/InventarioView.tsx`

**Qué hace hoy**
- Lista stock, vista historial, ingreso manual, carga Excel.

**Riesgos / Limitaciones**
- Filtra almacenes por IDs demo → oculta almacenes reales.  
- Carga masiva y entradas tienen poca validación visual.  

**Mejoras UX**
1) Remover filtros demo y mostrar todos.  
2) Modal de entrada con validación inline.  
3) Kardex con filtros por rango de fechas.  

**Compatibilidad móvil / Expo**
- DataTable y Modal requieren versión móvil (listas + BottomSheet).

---

## 5) TransferenciasView
**Archivo:** `frontend/src/modules/inventario/TransferenciasView.tsx`

**Qué hace hoy**
- Lista transferencias, crea nuevas, ver detalles.

**Riesgos / Limitaciones**
- Origen para técnicos está hardcodeado a almacén ID 1.  
- No hay selector de almacén destino por jerarquía.

**Mejoras UX**
1) Origen dinámico según almacén técnico.  
2) Validación de stock y preview del saldo.  
3) Flujo de confirmación “paso a paso”.  

**Compatibilidad móvil / Expo**
- Modal actual no es óptimo → usar pantallas separadas.

---

## 6) OperacionesView (OTs)
**Archivo:** `frontend/src/modules/operaciones/OperacionesView.tsx`

**Qué hace hoy**
- CRUD básico de OTs, asignación, cierre, consumo materiales.

**Riesgos / Limitaciones**
- Formularios largos sin pasos.  
- Historial OT requiere scroll sin navegación clara.  

**Mejoras UX**
1) Wizard por pasos para crear OT.  
2) Timeline de estado en cabecera.  
3) Acciones críticas con confirmación visible.  

**Compatibilidad móvil / Expo**
- Se necesita versión por secciones y listas cortas.

---

## 7) PlanificacionView
**Archivo:** `frontend/src/modules/operaciones/PlanificacionView.tsx`

**Qué hace hoy**
- Gestión proyectos, WBS, tareas, recursos.

**Riesgos / Limitaciones**
- Pantalla densa para móviles.  
- Tablas con muchas columnas sin vista compacta.

**Mejoras UX**
1) Vista de tareas tipo kanban o lista simple.  
2) Paneles colapsables por proyecto.  
3) Asignación con autocompletado.  

**Compatibilidad móvil / Expo**
- Requiere simplificación en flujos y pantallas separadas.

---

## 8) CatalogosView
**Archivo:** `frontend/src/modules/catalogos/CatalogosView.tsx`

**Qué hace hoy**
- CRUD de productos, clientes, proveedores, categorías.

**Riesgos / Limitaciones**
- Formulario con validación mínima.  
- Sin búsqueda rápida/filtrado.

**Mejoras UX**
1) Búsqueda instantánea.  
2) Validación por campo.  
3) Separar formularios por entidad.  

**Compatibilidad móvil / Expo**
- Requiere pantallas separadas por catálogo.

---

## 9) AlmacenesView
**Archivo:** `frontend/src/modules/catalogos/AlmacenesView.tsx`

**Qué hace hoy**
- Lista almacenes, botón “+ nuevo” sin implementación real.

**Riesgos / Limitaciones**
- No existe formulario de creación real.  

**Mejoras UX**
1) Implementar modal de creación y edición.  
2) Mostrar jerarquía padre/hijo visual.  

**Compatibilidad móvil / Expo**
- Vista tipo lista agrupada por jerarquía.

---

## 10) ConsignacionView + VendorProfileView
**Archivos:** `frontend/src/modules/consignacion/ConsignacionView.tsx`, `VendorProfileView.tsx`

**Qué hace hoy**
- Calcula deuda, procesa liquidaciones, muestra stock consignado.

**Riesgos / Limitaciones**
- Usa `idUsuario` hardcodeado.  
- Proceso de cálculo puede tardar y no muestra progreso.

**Mejoras UX**
1) Usar usuario autenticado real.  
2) Barra de progreso y estado al calcular.  
3) Resumen por proveedor antes de procesar.  

**Compatibilidad móvil / Expo**
- Tab principal + pantalla detalle por proveedor.

---

## 11) AuditoriaView
**Archivo:** `frontend/src/modules/auditoria/AuditoriaView.tsx`

**Qué hace hoy**
- Flujo simulado (mock) de auditoría.

**Riesgos / Limitaciones**
- No persiste ni ejecuta ajustes reales en backend.

**Mejoras UX**
1) Conectar con API real de auditoría.  
2) Subir conteo como “borrador” antes de aplicar.  
3) Lista de diferencias con resaltado.  

**Compatibilidad móvil / Expo**
- Flujo en 3 pantallas: lista → conteo → revisión.

---

## 12) ReportesView + ReporteTecnicoView + CierreMesView
**Archivos:** `frontend/src/modules/reportes/*`

**Qué hace hoy**
- SLA, consumo, técnico, cierre mensual.

**Riesgos / Limitaciones**
- Cierre mensual es mock.  
- Reportes no tienen filtros avanzados.

**Mejoras UX**
1) Filtros por rango y exportación.  
2) Cierre mensual real con snapshot backend.  
3) Estado “sin datos” claro.  

**Compatibilidad móvil / Expo**
- Separar reportes por pantallas dedicadas.

---

## 13) ActivosView
**Archivo:** `frontend/src/modules/activos/ActivosView.tsx`

**Qué hace hoy**
- Búsqueda por serial y timeline.

**Riesgos / Limitaciones**
- Historial usa kardex de producto, no del serial específico.  
- Falta listado general de activos.

**Mejoras UX**
1) Historial real por activo (serial).  
2) Vista de detalle con ubicación y responsable actual.  
3) Estado visual por tipo (asignado, almacén, etc.).  

**Compatibilidad móvil / Expo**
- Search + detalle en pantalla separada.

---

## 14) SystemUsersView
**Archivo:** `frontend/src/modules/usuarios/SystemUsersView.tsx`

**Qué hace hoy**
- CRUD básico usuarios + historial.

**Riesgos / Limitaciones**
- Perfil mezcla activos/OTs sin separar.

**Mejoras UX**
1) Tabs en perfil (OTs / Activos / Datos).  
2) Búsqueda y filtrado por rol.  

**Compatibilidad móvil / Expo**
- Lista simple + pantalla detalle por usuario.

---

## 15) WorkloadView
**Archivo:** `frontend/src/modules/usuarios/WorkloadView.tsx`

**Qué hace hoy**
- Carga de trabajo por técnico con tabla y calendario.

**Riesgos / Limitaciones**
- Calendario no interactivo real.  
- Vista densa en móvil.

**Mejoras UX**
1) Modo “lista compacta”.  
2) Asignación rápida con modal simplificado.  

**Compatibilidad móvil / Expo**
- Reemplazar con vista lista + detalle técnico.

---

## 16) VehiculosView
**Archivo:** `frontend/src/modules/vehiculos/VehiculosView.tsx`

**Qué hace hoy**
- CRUD vehículos y logs diarios.

**Riesgos / Limitaciones**
- No hay validación profunda en logs.  
- UI muy densa para móvil.

**Mejoras UX**
1) Flujo por pasos para logs.  
2) Adjuntar evidencia (foto/voucher real).  

**Compatibilidad móvil / Expo**
- Registrar log como formulario móvil con cámara.

---

# Plan de Mejora por Fases (para UX máxima + Expo)

## **Fase 1 — Estabilización y UX base (Web)**
1. Eliminar hardcodes (almacenes demo, idUsuario fijo).  
2. Validación y mensajes de error consistentes en formularios.  
3. Estado “sin datos” + skeleton loaders.  

## **Fase 2 — Experiencia visual y navegación**
1. Unificar navegación con router.  
2. Reducir estilos inline (usar tokens / theme).  
3. Componentizar tablas en versiones “compactas”.  

## **Fase 3 — Preparación Expo**
1. Identificar pantallas críticas móviles (OT, Inventario, Activos).  
2. Rediseñar flujos largos en pasos cortos.  
3. Sustituir charts (recharts → librerías RN).  

## **Fase 4 — Optimización avanzada**
1. Offline mode básico (cache de catálogos).  
2. Sync incremental con backend.  
3. UX para conexiones lentas y modo campo.  

---

# Siguientes pasos sugeridos
1. Confirmar **qué módulos son prioridad** para Expo.  
2. Definir **MVP móvil** (ej: OTs + Inventario + Activos).  
3. Migrar primero esos flujos a RN con diseño adaptado.  

