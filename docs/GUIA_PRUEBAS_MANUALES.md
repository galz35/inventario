# 🧪 GUÍA DE PRUEBAS MANUALES - SISTEMA INV

Esta guía contiene los flujos de trabajo reales para validar el sistema de punta a punta.
**Clave Maestra:** `123456`

---

## 🏗️ FLUJO 1: Abastecimiento y Entrada de Proveedor
**Objetivo:** Ingresar material nuevo al sistema y verificar que el stock y el Kardex se actualicen.
**Usuario:** `roberto.central@empresa.com` (Bodeguero Central)

1.  **Login:** Entra con la cuenta de Roberto.
2.  **Navegación:** Ve al módulo de **Inventario**.
3.  **Acción:** Haz clic en **"Entrada de Proveedor"**.
4.  **Datos:**
    *   **Proveedor:** Huawei Technologies.
    *   **Tipo:** Compra (o Consignación).
    *   **Items:** Agrega 50 unidades de "ONT Huawei".
5.  **Verificación:**
    *   Busca el producto en la tabla principal. El stock debe haber subido.
    *   Haz clic en **"Ver Historial"** (Kardex) del producto. Debe aparecer el movimiento "ENTRADA_COMPRA".

---

## 🚚 FLUJO 2: Transferencia a Cuadrilla (Dotación)
**Objetivo:** Entregar material de bodega a un técnico y verificar el cambio de responsabilidad.
**Usuario:** `roberto.central@empresa.com`

1.  **Navegación:** En el módulo de **Inventario**, selecciona **"Otras Operaciones" -> "Transferencia"**.
2.  **Acción:** Transfiere material de "Bodega Central Valle" hacia "Cargo de: Carlos Paredes".
3.  **Datos:** Envía 200 metros de "Fibra Drop".
4.  **Verificación:** 
    *   El stock de la Bodega Central debe bajar.
    *   Si cierras sesión y entras como Carlos (`carlos.paredes@empresa.com`), verás en tu Dashboard que ahora tienes 200m más a tu cargo.

---

## 📅 FLUJO 3: Planificación de Proyecto (WBS)
**Objetivo:** Crear el árbol de tareas de una obra y sus costos estimados.
**Usuario:** `sofia.lopez@empresa.com` (Supervisor)

1.  **Login:** Entra como Sofia.
2.  **Navegación:** Ve al módulo **"Plan de Trabajo"**.
3.  **Acción:** Selecciona el proyecto "Expansión FTTH Las Colinas".
4.  **Prueba WBS:** 
    *   Agrega una nueva **Tarea**: "Fase 3: Certificación de Enlaces".
    *   Entra a la tarea y haz clic en **"Estimar Materiales"**.
    *   Registra que esta tarea "debería" ocupar 2 fusionadoras y 100m de fibra.
5.  **Verificación:** Verás que el árbol de tareas se actualiza en tiempo real.

---

## 🛠️ FLUJO 4: Ejecución en Campo (Técnico)
**Objetivo:** El técnico reporta su trabajo, consume material de su camioneta y cierra el caso.
**Usuario:** `carlos.paredes@empresa.com` (Técnico)

1.  **Login:** Entra como Carlos.
2.  **Vista Inicial:** Verás tu Dashboard con la orden "Empresa Textil SA" esperándote.
3.  **Acción 1:** Entra a la Orden de Trabajo (OT).
4.  **Acción 2 (Consumo):** Haz clic en "Registrar MaterialUsado". Selecciona 50m de Fibra.
5.  **Acción 3 (Evidencia):** Sube una foto de prueba (puedes usar cualquier imagen de tu PC) y captura una firma digital en el panel.
6.  **Acción 4:** Haz clic en **"Cerrar Orden"**.
7.  **Verificación:** 
    *   Tu stock personal debe haber bajado de 500m a 450m.
    *   La orden debe pasar a estado "CERRADA" o "FINALIZADA".

---

## 👑 FLUJO 5: Auditoría Gerencial (Admin)
**Objetivo:** Ver el impacto financiero y operativo de lo anterior.
**Usuario:** `diana.martinez@empresa.com` (Administrador)

1.  **Login:** Entra como Diana.
2.  **Dashboard:** Verás el valor total del inventario actualizado.
3.  **Acción 1:** Ve a la sección **"Reportes" -> "Presupuesto vs Real"**.
4.  **Datos:** Busca el proyecto de Las Colinas. El sistema te mostrará cuánto material estimó Sofia (Flujo 3) contra lo que realmente consumió Carlos (Flujo 4).
5.  **Acción 2:** Entra al **Kardex Global** y filtra por el nombre de Carlos Paredes para ver todos sus movimientos de hoy.

---

## 🚀 NOTAS IMPORTANTES:
*   **Ahorro de Tiempo:** El sistema detecta automáticamente tu rol. Si eres Técnico, no verás opciones de administración para trabajar más rápido.
*   **Seguridad:** Intenta entrar a una URL de Admin siendo Técnico; el sistema debe bloquearte.
*   **Alertas:** Si consumes mucha fibra y bajas del mínimo, Diana recibirá una alerta de color rojo en su pantalla principal.
