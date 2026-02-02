# Guía de Pruebas de Usuario (UAT) — Sistema Inv

Esta guía proporciona los pasos necesarios para validar que el sistema de inventario y OT funciona correctamente según los requerimientos.

## 🔑 1. Acceso y Seguridad
- **Prueba**: Iniciar sesión con el usuario administrador.
- **Credenciales**: `admin@empresa.com` / `admin123`.
- **Resultado esperado**: El sistema debe redirigir al Dashboard Principal.

## 📦 2. Gestión de Almacenes y Stock
1. **Crear Almacén**: Registra un nuevo almacén tipo "CENTRAL".
2. **Entrada de Mercancía**: Realiza una entrada manual de stock para un producto (usar `Inv_sp_inv_stock_ajustar` o la UI).
3. **Transferencia**: Envía 10 unidades del Almacén A al Almacén B.
4. **Verificación**: Consultar el Kardex del producto para asegurar que el movimiento quedó registrado.

## 🛠️ 3. Operaciones en Campo (OT)
1. **Crear OT**: Genera una nueva OT de "Instalación".
2. **Asignar Técnico**: Asigna la OT a un usuario con rol Técnico.
3. **Consumo de Materiales**: Registra el consumo de 2 conectores de la bodega del técnico.
4. **Cierre de OT**: Sube una firma (base64 mock) y finaliza la OT.
5. **Resultado esperado**: El stock en la camioneta del técnico debe disminuir y el estado de la OT debe ser 'FINALIZADA'.

## 📱 4. Activos Serializados
1. **Asignación**: Asigna un Activo (ej. un Router) a un Técnico.
2. **Instalación**: Usa el SP `Inv_sp_activo_instalar` o el flujo de OT para instalarlo en el cliente.
3. **Reemplazo**: Simula una falla y usa `Inv_sp_ot_activo_reemplazar` para cambiar el equipo dañado por uno nuevo.
4. **Reparación**: Envía el equipo dañado a reparación y verifica su estado.

## 📊 5. Reportes y Auditoría
1. **Reporte SLA**: Verifica que la OT cerrada aparezca con su tiempo de ejecución comparado contra la meta.
2. **Conteo Físico**: Inicia un conteo en una bodega, ingresa una cantidad menor a la del sistema y finaliza el conteo.
3. **Resultado esperado**: El sistema debe ajustar automáticamente el stock y generar un registro en el Kardex por "Ajuste de Conteo".

## 💸 6. Consignación
1. **Liquidación**: Selecciona un proveedor y procesa una liquidación de consumos del mes.
2. **Verificación**: El reporte debe mostrar el total a pagar basado en el costo de los materiales consumidos que pertenecían al proveedor.
