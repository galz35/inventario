Archivo: frontend/src/modules/consignacion/VendorProfileView.tsx

Diseño
- Botón de regreso, tarjeta de perfil con KPIs básicos.
- Layout en dos columnas: stock actual y historial de cortes.
- DataTable embebidas para stock e historial.

Posibles errores / riesgos
- loadData guarda setData(res.data) sin normalizar data.data; si el backend envía wrapper, data puede quedar con forma inesperada.
- No hay estado de error; si falla la carga, solo se imprime en consola.

Mejoras concretas
- Normalizar respuesta con data.data || data para stock/historial.
- Mostrar mensaje de error o estado vacío cuando falla la carga.
