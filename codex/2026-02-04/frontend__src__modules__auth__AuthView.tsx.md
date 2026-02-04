Archivo: frontend/src/modules/auth/AuthView.tsx

Diseño
- Pantalla centrada con formulario tipo tarjeta y branding INVCORE.
- Campos de correo/carnet y contraseña con labels en mayúsculas.
- Botón primario a ancho completo y texto de versión al pie.

Posibles errores / riesgos
- Si el backend devuelve un objeto user distinto o vacío, se guarda inv_user sin validar campos mínimos (nombre/rol). Si faltan, la app puede mostrar datos vacíos en el sidebar.
- El mensaje de error mezcla casos: si loginData no trae token, se muestra mensaje genérico sin estado HTTP.

Mejoras concretas
- Validar estructura de loginData antes de guardar en localStorage (al menos idUsuario, nombre, rol).
- Deshabilitar botón cuando correo/contraseña están vacíos para evitar llamadas innecesarias.
- Incluir indicador visual de error en inputs (estados invalid/aria) para accesibilidad.
