Archivo: backend/src/app.controller.ts

Posibles errores / riesgos
- Endpoint GET /reset-passwords expone mensaje con SQL de actualización; en producción puede filtrar información sensible y no está protegido.
- GET /setup-db ejecuta scripts desde ruta absoluta en Windows (d:\inventario\docs\diseno_db_fase1.sql); falla en Linux/containers.
- Se usan require dinámicos en runtime (fs, path, base.repo, bcrypt) dentro del handler; dificulta tree-shaking y pruebas.
- El endpoint /setup-db ejecuta múltiples ALTER y CREATE sin transacción; una falla parcial deja el esquema inconsistente.
- Se ignoran errores de ALTER con catch vacío; se pierde visibilidad de fallas reales.

Mejoras concretas
- Proteger endpoints de mantenimiento con auth/rol o eliminarlos en builds productivos.
- Usar rutas configurables (env) en lugar de ruta absoluta.
- Envolver migración en transacción con rollback cuando sea posible.
- Registrar errores de ALTER con logger para auditoría.
