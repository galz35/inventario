# Plan Maestro Detallado de Migración a Flutter (Web + Mobile)

## 0. Resumen ejecutivo
Este plan define **cómo migrar el frontend actual en React** a Flutter manteniendo la operación activa, con foco en:
- Paridad visual (look & feel) con la UI actual.
- Paridad funcional por módulos de negocio.
- Arquitectura escalable por features.
- Operación offline-first con SQLite + sincronización robusta.

> Meta: una sola base Flutter para Web + Android/iOS, reduciendo deuda técnica y acelerando releases.

---

## 1. Objetivos concretos de migración

### 1.1 Objetivos de producto
1. Tener experiencia de usuario consistente en web y móvil.
2. Mantener el mismo flujo operativo por rol (Admin, Supervisor, Bodega, Técnico).
3. Mejorar tiempos de respuesta en red intermitente.
4. Disminuir errores operativos con validaciones y sincronización controlada.

### 1.2 Objetivos técnicos
1. Arquitectura limpia (presentation/domain/data).
2. Feature-first para trabajo paralelo por equipo.
3. Cobertura de pruebas en casos críticos de operación.
4. Observabilidad de errores y sincronización.

### 1.3 KPIs de éxito
- Paridad visual >= 90% en pantallas clave vs React.
- Paridad funcional >= 95% por módulo al cierre.
- Tiempo de carga inicial web < 3s en entorno objetivo.
- Ratio de sync exitosa > 98% en red estable.

---

## 2. Paridad visual con React (diseño y UX)

## 2.1 Identidad visual a conservar
- Fondo oscuro (`#121212`) y sidebar oscuro.
- Acentos rojos y azules según jerarquía funcional.
- Layout tipo panel con sidebar colapsable.
- Tarjetas KPI con alto contraste.
- Menú lateral segmentado por secciones (Inventario, Operaciones, Sistema).

## 2.2 Componentes UI a migrar 1:1 (fase inicial)
1. Sidebar + estado colapsado/expandido.
2. Header superior con título/contexto de pantalla.
3. Tarjetas KPI del Dashboard.
4. Tabla/listado reutilizable (equivalente DataTable).
5. Modal base y panel lateral reutilizable.

## 2.3 Librería de diseño Flutter (Design System)
- `AppTheme`: tokens de color, tipografía, radios, sombras.
- `InvShell`: layout raíz para pantallas privadas.
- `InvCard`, `InvStatCard`, `InvSectionTitle`.
- `InvButton` y `InvInput` estandarizados.

## 2.4 Regla de UX para mobile
- Navegación lateral pasa a drawer/rail.
- Formularios segmentados por pasos.
- Interacciones críticas con confirmación explícita.

---

## 3. Alcance funcional (migración por dominios)
1. **Auth y sesión**: login, refresh token, roles y guardas.
2. **Dashboard**: KPIs, alertas, accesos rápidos.
3. **Inventario**: stock global, kardex, ajustes, validación de stock.
4. **Transferencias**: enviar/confirmar/estado de tránsito.
5. **Operaciones OT**: backlog, ejecución técnica, consumo, evidencias.
6. **Activos**: asignación, historial, baja, reparación.
7. **Planificación**: agenda, capacidad y carga.
8. **Catálogos**: productos, categorías, almacenes, proveedores.
9. **Usuarios y seguridad**: gestión de usuarios y permisos.
10. **Reportes y auditoría**: reportes técnicos y trazabilidad.

---

## 4. Arquitectura objetivo Flutter

## 4.1 Estructura de carpetas
```text
flutter/
  docs/
  lib/
    app/
      router/
      theme/
    core/
      network/
      storage/
      sync/
      errors/
    features/
      auth/
      dashboard/
      inventario/
      transferencias/
      operaciones/
      activos/
      reportes/
      catalogos/
      usuarios/
    shared/
      layout/
      widgets/
      models/
```

## 4.2 Patrón por feature
- `presentation/`: páginas, widgets y providers de UI.
- `domain/`: entidades y casos de uso.
- `data/`: DTOs, mappers, datasource y repositorios.

## 4.3 Estado y navegación
- Estado: `Riverpod`.
- Navegación: `go_router` con guardas por autenticación y rol.

## 4.4 Manejo de errores
- Errores tipados (`Failure` por dominio).
- Mapeo centralizado de errores API/DB.
- Mensajes de UX claros por tipo de error.

---

## 5. Offline-first, asincronización y SQLite

## 5.1 Principios
- La fuente inmediata para UI es SQLite.
- La API remota sincroniza de forma incremental.
- Siempre habrá registro auditable de cambios locales pendientes.

## 5.2 Modelo SQLite inicial
- `sync_queue`: cola outbox de cambios locales.
- `sync_log`: resultados de sync y errores.
- `session_cache`: sesión + permisos cacheados.
- `inventario_cache`: stock y metadatos.
- `transferencias_cache`: cabeceras e items.
- `ot_cache`: ordenes y estados.

## 5.3 Estrategia de sincronización
### Push (local -> server)
- Lotes pequeños idempotentes.
- Reintentos con backoff exponencial + jitter.
- Bloqueo temporal de entidad ante error crítico.

### Pull (server -> local)
- Deltas por `updated_at`/`version`.
- Paginación para tablas grandes.
- Invalidación selectiva de cache por módulo.

### Conflictos
- Entidades críticas: decide servidor.
- Entidades colaborativas: merge por campo.
- Operaciones sensibles: flujo manual de resolución.

## 5.4 Asincronización y concurrencia
- Streams reactivos por repositorio.
- Cancelación de requests al navegar.
- Scheduler de sync por eventos:
  - cambio de conectividad,
  - login,
  - pull-to-refresh,
  - job periódico.

---

## 6. Seguridad
- Tokens en `flutter_secure_storage`.
- Sin datos sensibles en texto plano.
- Limpieza de sesión al logout/expiración.
- Guardas por rol en router y backend.
- Auditoría de eventos críticos (transferencias, ajustes, bajas).

---

## 7. Plan de ejecución por fases (12 semanas)

## Fase 0 (Sem 1): Gobierno y base
- Definir ADRs, convenciones, checklist DoD.
- Pipeline CI: analyze + test.
- Definir matriz de paridad React->Flutter.

**Salida:** marco técnico aprobado.

## Fase 1 (Sem 1-2): Bootstrap + UI shell
- Proyecto Flutter web/mobile.
- Theme + componentes base.
- Shell visual similar React (sidebar/header/cards).
- Login inicial + sesión local.

**Salida:** app base navegable con look similar.

## Fase 2 (Sem 3-5): Auth + Dashboard + Inventario
- Auth completa con roles.
- Dashboard con KPIs reales.
- Inventario lectura + cache SQLite.

**Salida:** primer piloto interno.

## Fase 3 (Sem 6-8): Transferencias + OT + Activos
- Flujos críticos operativos.
- Validaciones de negocio.
- Sincronización bidireccional parcial.

**Salida:** operación diaria parcial en Flutter.

## Fase 4 (Sem 9-10): Offline hardening
- Cola de sync completa.
- Resolución de conflictos.
- Métricas y alertas de sync.

**Salida:** experiencia robusta en red inestable.

## Fase 5 (Sem 11-12): Cierre y go-live
- Paridad final, UAT, plan de corte.
- Rollback plan y monitoreo post-lanzamiento.

**Salida:** despliegue controlado y migración activa.

---

## 8. Matriz de migración React -> Flutter
| React (actual) | Flutter (destino) | Estado |
|---|---|---|
| Layout sidebar + top area | `shared/layout/inv_shell.dart` | En progreso |
| DashboardView | `features/dashboard/presentation/dashboard_page.dart` | En progreso |
| AuthView | `features/auth/presentation/login_page.dart` | En progreso |
| InventarioView | `features/inventario/...` | Pendiente |
| TransferenciasView | `features/transferencias/...` | Pendiente |
| OperacionesView | `features/operaciones/...` | Pendiente |

---

## 9. Calidad y pruebas
- Unit tests: casos de uso/repositorios/mappers.
- Widget tests: shell, cards, forms críticos.
- Integration tests: login, inventario, transferencias.
- Pruebas de resiliencia: red nula/intermitente.
- Pruebas de compatibilidad web y móviles reales.

---

## 10. Riesgos y mitigación
1. **No paridad visual suficiente** -> Design system + checklist por pantalla.
2. **Complejidad de sync** -> incremental por módulo con métricas.
3. **Dependencia backend** -> contratos API versionados y delta endpoints.
4. **Cambios de alcance** -> control por roadmap y congelación de scope por sprint.

---

## 11. Estado actual de la migración (hoy)
✅ Carpeta `flutter/` creada.
✅ Plan detallado de migración definido.
✅ Base técnica inicial implementada.
✅ Primer layout visual tipo React iniciado.

🔜 Próximo hito inmediato:
- terminar shell con navegación por roles,
- conectar auth real,
- iniciar Inventario con datos API + SQLite.

---

## 12. Implementación técnica ya iniciada (baseline real)

### 12.1 App y navegación
- `main.dart` y `app.dart` con `ProviderScope` + `MaterialApp.router`.
- `go_router` con rutas para módulos principales:
  - `/dashboard`, `/inventario`, `/transferencias`, `/operaciones`, `/reportes`, `/usuarios`, `/activos`.
- Guardas por autenticación y permisos por módulo.

### 12.2 Auth
- `AuthController` con estado global y flujo de login/logout.
- `AuthRepositoryMock` temporal para acelerar integración UI.
- Base lista para reemplazo por repositorio real backend.

### 12.3 UI Shell (paridad React)
- `InvShell` reusable para sidebar + topbar + responsive drawer.
- Navegación principal centralizada y consistente entre módulos.
- Tokens visuales corporativos en `AppTheme`.

### 12.4 Inventario offline-first
- `InventarioRepositoryImpl` con lectura cache local (`inventario_cache`).
- Pull remoto demo + persistencia local.
- Pantalla de inventario con sincronización manual.

### 12.5 SQLite y Sync
- Tablas iniciales: `sync_queue`, `sync_log`, `inventario_cache`.
- `SyncEngine` inicial para procesar pendientes (modo baseline).

### 12.6 Criterio para declarar “100% global”
Se considerará 100% cuando se cumpla todo:
1. Paridad visual y funcional validada por módulo contra React.
2. Flujos críticos productivos completos en web y mobile.
3. Sync offline validada en escenarios de red real.
4. Suite de pruebas automatizadas con cobertura suficiente.
5. Go-live controlado con monitoreo post-lanzamiento.

---

## 13. Avance técnico incremental adicional (Transferencias offline)

### 13.1 Transferencias (baseline funcional)
- Se implementó dominio `TransferenciaItem`.
- Se agregó `TransferenciasRepository` + implementación SQLite.
- Se incorporó `TransferenciasController` con carga y creación local.
- Se reemplazó el placeholder por `TransferenciasPage` con formulario + listado.

### 13.2 Persistencia y sincronización de transferencias
- Nueva tabla local `transferencias_cache`.
- Al crear transferencia:
  1. se guarda localmente,
  2. se encola evento en `sync_queue` (`entity=transferencia`, `action=create`),
  3. se registra evento en `sync_log`.

### 13.3 SyncEngine hardening inicial
- Validación de payload JSON al procesar cola.
- Manejo de reintentos incrementales (`retries`).
- Cambio de estado a `error` al superar umbral de reintentos.
- Resultado `ok/partial` en bitácora de sync.

### 13.4 Impacto hacia meta 100%
Este avance reduce riesgo de la fase offline y deja patrón replicable para:
- consumos OT,
- ajustes de inventario,
- confirmaciones de transferencias,
- eventos de activos.


## 12. Notificaciones push (FCM gratis)
- Canal objetivo para móvil y web: Firebase Cloud Messaging (FCM).
- Evento clave inicial: asignaciones a técnicos (`tecnicos_asignaciones`).
- Flujo recomendado: backend emite notificación topic/token al crear asignación (OT/transferencia/activo).
- En app Flutter: solicitar permisos, registrar token por usuario, suscribir topics por rol/equipo y enrutar por `data.route`.
- Costo: FCM push es gratuito; validar costos solo de servicios auxiliares si se usan (Functions/Firestore).

- Registro FCM por usuario en login (estado actual: implementado en mock).

- AuthRepositoryImpl + session_cache implementados como base para login persistente y backend real.

- SyncEngine con validaciones específicas para notificaciones FCM y métricas de cola en dashboard.

- Dashboard operativo con mantenimiento de cola (retry error + cleanup done).

- Inventario con ajuste de stock local + encolado sync implementado.
