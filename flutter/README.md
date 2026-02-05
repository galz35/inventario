# Flutter Migration Workspace

Migración del sistema Inventario a Flutter (Web + Mobile) con foco en paridad visual con React, arquitectura escalable y operación offline-first.

## Estado actual
- ✅ Plan maestro detallado y roadmap de migración.
- ✅ Router con múltiples módulos y guardas de acceso por auth/permisos.
- ✅ Shell visual (sidebar/topbar) consistente para web y móvil.
- ✅ Auth base con estado global (`Riverpod`) y flujo de login mock.
- ✅ Inventario offline-first mejorado (cache SQLite, refresh, ajustes +/-, cola sync).
- ✅ Transferencias offline-first mejoradas (crear local, cambio de estado, métricas por estado, cola sync).
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

## Próximos pasos para llegar al 100%
1. Conectar auth real al backend y refresh tokens.
2. Migrar todas las vistas React a Flutter con checklist de paridad visual.
3. Completar módulos operativos (OT, activos, reportes, usuarios) y profundizar transferencias.
4. Endurecer sincronización y conflictos por entidad.
5. Incorporar suite completa de pruebas y validación cross-platform.


## Push móvil/web (FCM gratis)
- Guía de implementación: `docs/FCM_NOTIFICACIONES_GRATIS.md`.
- Servicio base: `lib/core/notifications/push_notification_service.dart`.
- Objetivo operativo: alertar asignaciones a técnicos en tiempo real.
