## Paso 3: Ver la compilación en vivo
Una vez que hagas el `git push`, ve a la pestaña **Actions** en tu repositorio de GitHub:
1.  Verás un flujo llamado "Flutter Build APK" (o Web) ejecutándose.
2.  Haz clic en él para ver los logs. Tardará unos 8 a 10 minutos (Android + Web).
3.  Cuando termine (visto en verde), busca la sección **Artifacts** al final de la página.
4.  ¡Allí estarán dos archivos listos: `app-release-apk` (Móvil) y `web-build` (Web)!

---

## Compilación Local (Solo si quieres probar en tu laptop)

Si deseas intentar compilar localmente (aunque Android suele fallar por RAM, la Web debería funcionar):

### Para Web:
```bash
flutter build web --release
```
*Esto generará la carpeta `build/web` que puedes abrir en tu navegador.*

### Para Móvil (APK):
```bash
flutter build apk --release
```
*Si falla por memoria, usa la opción de GitHub Actions explicada arriba.*

---

# Alternativa: Codemagic (Más visual)

Si prefieres no usar comandos de Git y quieres algo más visual:

1.  Ve a [Codemagic.io](https://codemagic.io/) y regístrate con tu cuenta de GitHub.
2.  Haz clic en **Add application**.
3.  Selecciona tu repositorio de GitHub.
4.  Selecciona el tipo de proyecto: **Flutter App**.
5.  En la configuración visual:
    *   **Build for:** Selecciona **Android**.
    *   **Mode:** Selecciona **Release**.
    *   **Build format:** Selecciona **APK**.
6.  Haz clic en el botón superior **Start new build**.
7.  Codemagic te enviará un correo con el APK descargable cuando termine.

---

### ¿Qué opción usar?
*   **GitHub Actions:** Ideal si quieres que cada vez que guardes un cambio importante, el APK se genere solo.
*   **Codemagic:** Ideal si prefieres una página web con botones y no quieres tocar archivos de configuración.

He dejado activado GitHub Actions para ti en el archivo `.github/workflows/build_apk.yml`. 
