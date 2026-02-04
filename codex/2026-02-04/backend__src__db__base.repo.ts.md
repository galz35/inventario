Archivo: backend/src/db/base.repo.ts

Posibles errores / riesgos
- sanitizeParamsForLog no protege claves sensibles si vienen en nested objects distintos a {valor, tipo}; solo mira el nivel superior.
- flushLogs aborta si slowTableExists es false y no se reintenta crear la tabla; se pierde telemetría permanente.
- resetPool se llama al error del pool sin backoff; podría generar bucles de reconexión en errores persistentes.

Mejoras concretas
- Ampliar sanitización para objetos anidados y claves sensibles en estructuras complejas.
- Agregar reintento controlado para recuperar telemetría cuando la tabla vuelva a existir.
- Implementar backoff incremental en resetPool/obtenerPoolSql.
