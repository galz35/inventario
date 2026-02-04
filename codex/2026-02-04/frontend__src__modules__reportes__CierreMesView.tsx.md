Archivo: frontend/src/modules/reportes/CierreMesView.tsx

Diseño
- Encabezado y explicación del cierre mensual.
- Tarjeta de acción para generar cierre y tarjeta informativa de inventario.
- Tabla de historial de cierres y vista previa opcional.

Posibles errores / riesgos
- El texto "Febrero 2026" está hardcodeado; no cambia con el mes actual.
- currentStock nunca se carga; el bloque de vista previa queda inalcanzable.
- En handleGenerarCierre, si localStorage no tiene inv_user, se envía idUsuario undefined.

Mejoras concretas
- Generar el mes actual dinámicamente para el título de la tarjeta.
- Implementar carga de currentStock si se espera mostrar preview.
- Validar idUsuario antes de enviar y mostrar error si falta sesión.
