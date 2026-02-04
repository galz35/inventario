Archivo: backend/src/auth/auth.repo.ts

Posibles errores / riesgos
- obtenerCredenciales y actualizarRefreshToken intentan ALTER TABLE en tiempo de ejecución; en entornos con permisos restringidos fallará y bloqueará login/refresh.
- Si hay error distinto a "Invalid column name" en obtenerCredenciales, se loguea y retorna null; esto puede enmascarar errores y provocar credenciales inválidas sin mensaje claro.
- obtenerUsuarioPorIdentificador retorna rolGlobal usando rolNombre o 'Empleado'; si rolNombre es null, se pierde distinción de roles por idRol.

Mejoras concretas
- Mover reparaciones de schema a migraciones fuera del flujo de autenticación.
- Propagar errores críticos con un tipo controlado para observabilidad.
- Normalizar rolGlobal basado en idRol cuando falte rolNombre.
