# Guía de Solución de Errores Comunes - Inventario App (Flutter)

Este documento recopila los problemas técnicos encontrados durante la configuración del entorno de desarrollo y despliegue en dispositivos físicos (técnicos de campo).

## 1. Error Crítico: "Gradle build daemon disappeared unexpectedly"
**Síntoma:** Al intentar compilar (`flutter run`), el proceso falla inesperadamente y muestra que el "Daemon" desapareció.
**Causa:** El archivo de configuración `android/gradle.properties` asignaba **8GB** de RAM (`-Xmx8G`) al proceso de construcción. Esto es excesivo para muchas laptops de desarrollo y provoca que el sistema operativo "mate" el proceso por falta de memoria.
**Solución:**
Editar `android/gradle.properties` y reducir la memoria a 2GB (suficiente para compilar apps medianas):
```properties
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8
```

## 2. Dispositivo Android Físico no Detectado
**Síntoma:** `flutter devices` solo muestra Windows, Chrome o Edge, pero no el celular conectado por USB.
**Solución:**
1.  **Cable USB:** Asegurar que el cable permite transferencia de datos (no solo carga).
2.  **Modo Desarrollador:** Activar en *Ajustes > Acerca del teléfono > Número de compilación* (tocar 7 veces).
3.  **Depuración USB:** Activar en *Ajustes > Sistema > Opciones de desarrollador*.
4.  **Huella RSA:** Al conectar, aceptar el mensaje en pantalla "¿Permitir depuración por USB?".
5.  **Modo de Conexión:** Cambiar de "Solo carga" a **"Transferencia de archivos (MTP)"** en la barra de notificaciones.

## 3. Error "cmdline-tools component is missing"
**Síntoma:** `flutter doctor` muestra este error en la sección "Android toolchain".
**Causa:** Falta la herramienta de línea de comandos del SDK de Android.
**Solución:**
1.  Abrir Android Studio.
2.  Ir a **Settings > Languages & Frameworks > Android SDK > SDK Tools**.
3.  Marcar **Android SDK Command-line Tools (latest)** y aplicar.
4.  Ejecutar `flutter doctor --android-licenses` y aceptar las licencias.

## 4. Error de Compilación: "The name 'MyApp' isn't a class"
**Síntoma:** Error en `test/widget_test.dart` después de recrear archivos del proyecto.
**Causa:** `flutter create .` genera un test por defecto que asume que la clase principal se llama `MyApp`.
**Solución:**
Editar `test/widget_test.dart` para usar la clase real del proyecto (`InventarioApp`) y envolverla en un `ProviderScope` (requerido por Riverpod):
```dart
await tester.pumpWidget(
  const ProviderScope(
    child: InventarioApp(),
  ),
);
```

## 5. Falta de archivos de construcción Android
**Síntoma:** Error "Build failed due to use of deleted Android v1 embedding" o carpetas faltantes en `android/`.
**Causa:** El proyecto no tenía los archivos de plataforma generados o estaban desactualizados.
**Solución:**
Ejecutar el siguiente comando en la raíz del proyecto Flutter para regenerar la estructura nativa:
```bash
flutter create .
```

## 6. Conexión a Backend Local (API)
**Configuración:**
Para que el celular (campo) pueda consumir el backend que corre en la laptop (desarrollo):
1.  Backend debe escuchar en `0.0.0.0` (Fastify adapter configurado en `main.ts`).
2.  Firewall de Windows debe permitir el puerto (Node.js/3000).
3.  App móvil debe apuntar a la IP de la red Wi-Fi local (ej: `10.4.127.159`), no a `localhost`.

**Archivo clave:** `lib/core/api/api_client.dart`
```dart
// IP Local Wifi (Ejemplo)
static const String baseUrl = 'http://10.X.X.X:3000/api';
```

---
**Nota sobre Teléfonos de Gama Baja:**
La configuración de memoria de Gradle (`-Xmx2048m`) afectas solo a la **velocidad de compilación** en la computadora del desarrollador. No afecta el rendimiento de la app en el teléfono del técnico. La app Flutter resultante está optimizada para correr fluidamente en dispositivos de gama media/baja.
