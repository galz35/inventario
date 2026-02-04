Archivo: backend/src/auth/auth.controller.ts

Posibles errores / riesgos
- En login(), se captura cualquier error y se lanza new Error con stack completo, lo que puede exponer información sensible al cliente.
- Se hace console.error('Login Error', e) sin sanitizar; puede registrar contraseñas si el error incluye payload.
- refresh() usa jwtService.verifyAsync sin especificar audiencia/issuer; si se requiere en config, no se valida aquí.

Mejoras concretas
- Reemplazar throw new Error(...) por HttpException controlada y mensaje genérico.
- Usar logger con sanitización de datos sensibles.
- Configurar verifyAsync con issuer/audience si se usan en JWT.
