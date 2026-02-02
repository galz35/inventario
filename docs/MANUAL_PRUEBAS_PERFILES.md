# 🚀 Guía de Pruebas y Perfiles - INVCORE

Este documento detalla la experiencia esperada para cada perfil de usuario según los datos reales cargados en el sistema y los escenarios de prueba recomendados.

---

## 🔐 Credenciales Generales
- **Contraseña:** `123456`
- **URL Base:** `http://localhost:5173`

---

## 1. 👑 Perfil: ADMINISTRADOR GLOBAL
**Usuario:** `diana.martinez@empresa.com` (o `admin@empresa.com`)
**Rol:** Control Total / Dirección Técnica

### 📂 Páginas que debe ver:
- **Inicio:** Dashboard con "Valor Total de Inventario", "Alertas de Stock" y "Cumplimiento de SLA".
- **Stock Global:** Puede ver el inventario de todos los almacenes (Central, Norte, Sur).
- **Control de Activos:** Trazabilidad de cada Fusionadora y OTDR por número de serie.
- **Auditoría:** (Si está habilitado) Bitácora de movimientos realizados por otros usuarios.

### 📊 Datos esperados (Vida Real):
- **Valor Inventario:** Aproximadamente $50k+ (basado en stock de ONTs y Fibra).
- **Alertas:** Verá "Stock Bajo" en productos como "Conectores SC" (Stock 15 < Min 100).
- **Proyectos:** Verá la "Expansión FTTH Las Colinas" al 45% de avance.

### 🧪 Escenarios de Prueba:
1. **Auditoría de Stock:** Ir a "Inventario" -> Filtrar por "Almacén Central" -> Verificar que hay bobinas de 750m.
2. **Revisión de SLA:** Ver en el Dashboard qué porcentaje de OTs se cierran en menos de 48h.

---

## 2. 🏗️ Perfil: SUPERVISIÓN Y DESPACHO
**Usuario:** `sofia.lopez@empresa.com`
**Rol:** Gestor de Cuadrillas / Planificador

### 📂 Páginas que debe ver:
- **Planificación WBS:** Gestión de fases y tareas de construcción.
- **Gestión de OTs:** Creación y asignación de Órdenes de Trabajo a técnicos.
- **Traslados:** Autorización de envío de materiales a cuadrillas.

### 📊 Datos esperados (Vida Real):
- **OTs por Asignar:** Verá una lista de requerimientos marcados como "REGISTRADA" que esperan técnico.
- **Cuadrillas:** Puede monitorear la carga de Juan Rodriguez (2 OTs) y Miguel Torres (2 OTs).

### 🧪 Escenarios de Prueba:
1. **Asignación en Vivo:** Crear una "Nueva OT" para el cliente "Hotel Inter" -> Asignarla a `Andrea Rivas`.
2. **Despacho de Material:** Ir a "Traslados" -> Enviar 1 Bobina de Fibra del Almacén Central al almacén del técnico `Carlos Paredes`.

---

## 3. 🛠️ Perfil: EQUIPO TÉCNICO (CAMPO)
**Usuario:** `juan.rodriguez@empresa.com`
**Rol:** Ejecutor / Técnico FTTH

### 📂 Páginas que debe ver:
- **Mis Órdenes:** Su hoja de trabajo diaria (Limpia, sin órdenes de otros).
- **Mis Herramientas:** Equipos serializados bajo su custodia.
- **Traslados / Pedidos:** Solicitudes de material a bodega.

### 📊 Datos esperados (Vida Real):
- **Órdenes:** OT #2 (Mantenimiento Los Fogones) y OT #16 (Instalación Residencial).
- **Activos:** Fusionadora Fujikura (SN: FUS-S72C-889).
- **Pedidos:** Verá una transferencia "EN CAMINO" con ONTs enviadas por Sofia.

### 🧪 Escenarios de Prueba:
1. **Registro de Consumo:** Abrir la OT #2 -> Ir a "Materiales" -> Registrar el uso de "50m de Fibra" y "2 Conectores".
2. **Cierre de Tarea:** Escribir nota de cierre: "Se restablece señal en ONT, potencia -19dBm" -> Click en "Finalizar Orden".

---

## 4. 📦 Perfil: BODEGA Y LOGÍSTICA
**Usuario:** `roberto.central@empresa.com`
**Rol:** Jefe de Almacén Valle

### 📂 Páginas que debe ver:
- **Inventario Local:** Solo el stock físico de su bodega asignada.
- **Recepciones:** Entrada de mercancía de proveedores.
- **Despacho:** Picking de materiales solicitados por técnicos.

### 📊 Datos esperados (Vida Real):
- **Stock:** 15,000m de Fibra Drop y 500 ONTs Huawei.
- **Movimientos:** Historial de entradas por "Carga Inicial" y salidas por "Consumo OT".

### 🧪 Escenarios de Prueba:
1. **Recepción de Proveedor:** Registrar la entrada de 200 ONTs nuevas del proveedor "Huawei Technologies".
2. **Ajuste de Stock:** Realizar un ajuste de -5 unidades en "Splitters" por concepto de "Pieza Danada" para probar la auditoría.

---

## 💡 Resumen de Escenarios "Vida Real" para Probar

1. **"El ciclo del material":**
   - Admin ve que falta Fibra.
   - Bodega recibe Fibra del proveedor.
   - Supervisor transfiere Fibra a Juan Rodriguez.
   - Juan usa la Fibra en una Instalación (OT).
   - El sistema descuenta automáticamente el stock de la unidad móvil de Juan.

2. **"La pérdida de herramienta":**
   - Juan reporta que su Fusionadora necesita reparación.
   - Admin cambia el estado del activo a "REPARACION".
   - El técnico deja de verla en "Mis Herramientas" hasta que el taller la devuelva.

3. **"Urgencia Crítica":**
   - Sofia crea una OT con Prioridad "CRITICA".
   - Juan la ve resaltada en rojo en su móvil.
   - Diana (Admin) recibe la alerta en su Dashboard de OTs críticas activas.
