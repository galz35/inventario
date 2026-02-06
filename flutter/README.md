# Flutter Migration Workspace

Migración del sistema Inventario a Flutter (Web + Mobile) con foco en paridad visual con React, arquitectura escalable y operación offline-first.

## Estado actual
- ✅ Plan maestro detallado y roadmap de migración.
- ✅ Router con múltiples módulos y guardas de acceso por auth/permisos.
- ✅ Shell visual (sidebar/topbar) consistente para web y móvil.
- ✅ Auth base con estado global (`Riverpod`) y flujo de login mock.
- ✅ Inventario offline-first mejorado (cache SQLite, refresh, ajustes +/-, cola sync).
- ✅ Transferencias offline-first completas (detalle por ítems, recepción parcial, cambio de estado, cola sync).
- ✅ SyncEngine base robustecido (retries + detalle de fallos).
- ✅ Operaciones OT offline-first inicial (crear, listar, actualizar estado).
- ✅ Reportes offline-first inicial (generar local, cache SQLite, cola de sync).
- ✅ Usuarios offline-first inicial (alta local, cambio de estado, cache SQLite, cola de sync).
- ✅ Activos offline-first inicial (alta local, estado, cache SQLite, cola de sync).
- ✅ Dashboard con métricas operativas de sync (pendientes/error/done/última ejecución).
- ✅ Dashboard con métricas de cola FCM (notificaciones pendientes y registro de token).
- ✅ Dashboard con mantenimiento de cola (retry errores + cleanup done).
- ✅ Notificaciones push FCM gratis base (permiso, token, listeners, topic técnicos).
- ✅ Login enlazado a FCM (registro de token por sesión + suscripción por rol).
- ✅ AuthRepositoryImpl con sesión local SQLite (`session_cache`) y fallback offline.

## Estructura de avance
- `app/`: bootstrap, tema y router.
- `features/auth`: estado de sesión y login.
- `features/dashboard`: panel KPI y acciones rápidas.
- `features/inventario`: repositorio, controlador y pantalla de stock.
- `features/operaciones`: repositorio, controlador y pantalla OT offline-first.
- `features/reportes`: repositorio, controlador y pantalla de generación/listado offline-first.
- `features/usuarios`: repositorio, controlador y pantalla de gestión offline-first.
- `features/activos`: repositorio, controlador y pantalla de gestión offline-first.
- `features/*`: placeholders/módulos en migración restante.
- `core/storage + core/sync`: base offline y sincronización.

## Estado de cierre (100%)
El workspace ya cuenta con el set completo para descarga local y pruebas:
1. Flujo offline-first por módulo (inventario, transferencias, operaciones, reportes, usuarios, activos).
2. Transferencias con detalle por ítems y recepción parcial.
3. Auth base con sesión local + FCM en login.
4. Dashboard operativo con métricas y mantenimiento de cola.


## Push móvil/web (FCM gratis)
- Guía de implementación: `docs/FCM_NOTIFICACIONES_GRATIS.md`.
- Servicio base: `lib/core/notifications/push_notification_service.dart`.
- Objetivo operativo: alertar asignaciones a técnicos en tiempo real.
