Archivo: backend/src/auth/auth.service.ts

Posibles errores / riesgos
- validateUser escribe en consola identificador y estados internos (usuario encontrado, credenciales, match); expone información sensible en logs.
- En login(), auditService.log usa ip: 'IP_MOCK'; no se registra IP real.
- resolveMenu retorna null para admins; en frontend se asume menú completo, pero no queda explícito en backend.

Mejoras concretas
- Reducir logs de autenticación o moverlos a nivel debug con sanitización.
- Incluir IP real desde request (o pasar desde controlador) en audit.
- Documentar explícitamente el contrato de menuConfig para admins.
