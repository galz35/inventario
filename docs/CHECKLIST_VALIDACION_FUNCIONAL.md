# Checklist de Validación Funcional - INVCORE

Usa esta lista para verificar que cada página cumpla con su propósito técnico y operativo. No pases al siguiente paso si un punto falla.

## ✅ Módulo 1: Autenticación e Identidad
- [ ] **Login:** Credenciales correctas permiten acceso; incorrectas bloquean con mensaje.
- [ ] **Persistencia:** Al recargar (F5), el usuario sigue logueado.
- [ ] **Token JWT:** El servidor firma un token real (ver en consola > Application > LocalStorage).
- [ ] **Roles:** Un técnico NO debe ver el menú 'Catálogos' o 'Almacenes' en el sidebar.

## ✅ Módulo 2: Inventario (Stock y Movimientos)
- [ ] **Carga Inicial:** La tabla muestra datos reales de `Inv_inventario_stock`.
- [ ] **Filtrado:** Escribir en el header de 'Producto' filtra la lista instantáneamente.
- [ ] **Kardex:** Al hacer clic en 'Ver Historial', el modal muestra los movimientos de ese producto específico.
- [ ] **Identidad:** Si entro como Roberto (Almacén Central), solo veo items de 'Almacén Central'.

## ✅ Módulo 3: Operaciones (Ordenes de Trabajo)
- [ ] **Listado:** Se ven las OTs con colores de badge correctos según prioridad.
- [ ] **Detalle Modal:** Al hacer clic en una Card, se abre el detalle con datos del cliente.
- [ ] **Consumo:** El listado de 'Materiales Consumidos' en el detalle es dinámico (no estático).
- [ ] **Cierre de OT:** El botón 'Finalizar' pide confirmación y cambia el estado a 'FINALIZADA' en la DB.

## ✅ Módulo 4: Planificación (WBS)
- [ ] **Selección:** Al elegir un proyecto de la lista izquierda, el centro se actualiza con sus tareas.
- [ ] **Estructura:** Las subtareas deben aparecer con indentación (sangría) a la derecha.
- [ ] **Acciones:** El botón '+ Nueva Tarea' debe abrir un formulario (no solo alerta).

## ✅ Módulo 5: Administración (Catálogos y Almacenes)
- [ ] **Pestañas:** Cambiar entre Productos/Proveedores/Categorías actualiza la tabla correctamente.
- [ ] **Guardado:** Crear un nuevo producto aparece inmediatamente en la lista tras el cartel de éxito.
- [ ] **Almacenes:** La lista de almacenes muestra el tipo (CENTRAL, TECNICO, etc.) y su estado operativo.

## ✅ Módulo 6: Inteligencia (Reportes / Dashboard)
- [ ] **KPIs Dashboard:** Las cifras coinciden con la realidad operativa.
- [ ] **Reporte SLA:** La tabla de reportes muestra el estado 'DENTRO' o 'FUERA' basado en la meta de horas.
- [ ] **Exportación:** El botón 'Exportar Excel' genera un archivo legible (si está implementado en backend).

---
**Nota para el revisor:** Si encuentras un punto que solo lanza una alerta visual ("Formulario en desarrollo"), márcalo como **PENDIENTE** para completarlo.
