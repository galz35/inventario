Archivo: frontend/src/modules/vehiculos/VehiculosView.tsx

Diseño
- Encabezado con botón de nuevo vehículo.
- DataTable de flota con acciones por fila.
- Modal para alta/edición de vehículo.
- Modal para log diario con inputs de km y gasto.
- Modal de historial con tabla scrollable.

Posibles errores / riesgos
- loadData usa vehService.getVehiculos() y setVehiculos(vRes.data || []); si la API responde {data: []}, se pierde la lista.
- handleSaveLog envía kmEntrada/kmSalida como string; no convierte a number.
- El modal de log diario permite kmSalida menor a kmEntrada; no hay validación.

Mejoras concretas
- Normalizar respuesta de vehService con data.data || data.
- Convertir kmEntrada/kmSalida y gastoCombustible a number antes de enviar.
- Validar kmSalida >= kmEntrada y mostrar error si no cumple.
