# FCM (Firebase Cloud Messaging) gratis para asignaciones a técnicos

Firebase Cloud Messaging (FCM) es **gratis** para enviar notificaciones push en Android, iOS y Web.

## Objetivo
Enviar notificaciones cuando se asigna una OT/transferencia/activo a un técnico.

## Modelo recomendado
- Cada dispositivo móvil/web obtiene un `fcmToken`.
- El app se suscribe a topics por rol/equipo (ej. `tecnicos_asignaciones`).
- El backend envía push por topic o por token directo.

## Implementación base en este workspace
- Servicio: `lib/core/notifications/push_notification_service.dart`.
- Inicialización temprana en `InventarioApp`.
- Permisos + listeners foreground.
- Suscripción automática al topic `tecnicos_asignaciones`.

## Flujo sugerido para asignaciones
1. Supervisor crea asignación en backend.
2. Backend persiste evento y determina destino (`token` o `topic`).
3. Backend llama FCM HTTP v1 con título/cuerpo/data.
4. Técnico recibe push y abre detalle dentro de Flutter.

## Payload sugerido
```json
{
  "notification": {
    "title": "Nueva asignación",
    "body": "OT-502 asignada a tu cuadrilla"
  },
  "data": {
    "type": "ot_assignment",
    "ot_id": "502",
    "route": "/operaciones"
  }
}
```

## Requisitos de configuración (pendiente por entorno)
- Crear proyecto Firebase.
- Android: `google-services.json` + configuración Gradle.
- iOS: `GoogleService-Info.plist` + capabilities de push.
- Web: `firebase-messaging-sw.js` + config web.
- Generar `firebase_options.dart` con FlutterFire CLI.

## Notas de costo
- FCM push: gratuito.
- Costos pueden aparecer en otros servicios (Firestore, Functions, etc.), no en el envío push de FCM en sí.


## Registro por usuario al login (implementado)
- En `AuthController.login` se obtiene token con `PushNotificationService.getToken()`.
- Si existe token, se invoca `AuthRepository.registerDeviceToken(...)`.
- Luego se suscriben topics por rol con `subscribeUserTopics(role)` (ej. `rol_admin`, `tecnicos_asignaciones`).
