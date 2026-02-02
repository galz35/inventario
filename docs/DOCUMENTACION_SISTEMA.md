# 📔 Documentación Principal: Sistema de Gestión de Inventario y Proyectos (INVCORE)

## 1. Introducción
INVCORE es una solución integral diseñada para empresas de servicios de campo (Telecomunicaciones, Energía, Mantenimiento) que necesitan un control total sobre sus activos, desde que entran al almacén por parte del proveedor hasta que son instalados en el domicilio del cliente por un técnico.

---

## 2. Flujos Principales (Paso a Paso)

### A. Gestión de Almacén y Responsabilidades
1.  **Carga Masiva**: El administrador o encargado de almacén descarga la plantilla de Excel, llena la información de los productos y la sube al sistema.
2.  **Entrada Directa**: Para compras menores, se usa el formulario de "Entrada de Proveedor", especificando si el material entra como propiedad de la empresa o en consignación.
3.  **Entrega a Personal (Stock a Cargo)**: Se realizan "Transferencias" de la Bodega Central al **Personal Operativo (Técnicos) o a un Proyecto específico**. El sistema no rastrea "vehículos", rastrea **Humanos Responsables**. El material se suma al inventario del técnico solo cuando este confirma la recepción.

### B. Planificación y Proyectos (Fases y Tareas)
1.  **Estructura WBS**: Se crea un Proyecto y se desglosa en Tareas (ej. "Instalación de Nodo", "Fibra Óptica Calle 5").
2.  **Estimación**: Se define que para la "Tarea A" se requieren 100m de cable y 1 ONT.
3.  **Viculación**: Todas las Órdenes de Trabajo (OT) que se abran para ese sector se vinculan a la tarea correspondiente del proyecto.

### C. Ejecución de Órdenes (OT)
1.  **Despacho**: Un operador crea la OT con los datos del cliente y se la asigna a un técnico.
2.  **Ejecución**: El técnico recibe la orden en su dispositivo móvil.
3.  **Consumo Real**: El técnico registra qué materiales de su camioneta usó realmente.
4.  **Cierre y Evidencia**: Se toman fotos del trabajo terminado y el cliente firma en la pantalla del celular.

---

## 3. Matriz de Responsabilidades (Roles)

| Rol | Responsabilidad Principal | Acciones Clave |
| :--- | :--- | :--- |
| **Administrador** | Supervisión Financiera y Seguridad | Ver KPIs, gestionar usuarios, auditar Kardex local global. |
| **Almacenista** | Integridad del Stock | Inventarios cíclicos, carga de Excel, despacho a técnicos. |
| **Despachador** | Logística de Campo | Crear y asignar OTs, seguimiento de estados de la orden. |
| **Técnico** | Ejecución y Reporte | Cargar consumo de material, subir fotos, cerrar trabajos. |
| **Auditor** | Control de Calidad | Revisar fotos de evidencia, validar que el consumo real coincida con el plan. |

---

## 4. Gestión de Estados (Workflows)

### Estados de la Orden (OT):
*   **REGISTRADA**: La orden existe pero no tiene técnico.
*   **ASIGNADA**: El técnico ya sabe que debe ir al sitio.
*   **PROCESO**: El técnico marcó que ya inició el trabajo.
*   **FINALIZADA**: El trabajo terminó, consumo registrado y fotos subidas.
*   **CERRADA**: Auditoría validó todo y el material se descuenta definitivamente del inventario legal.

### Estados de Proyectos:
*   **PLANIFICADO**: Solo existe la estructura de tareas.
*   **EJECUCIÓN**: Hay OTs abiertas consumiendo material.
*   **FINALIZADO**: Proyecto cerrado, se genera el reporte de Presupuesto vs Real.

---

## 5. Garantías de Datos y Reglas de Oro
1.  **Cero Stock Negativo**: El sistema lanza un error fatal si intentas consumir algo que no tienes en tu almacén/camioneta. **Sin excepciones.**
2.  **Evidencia Obligatoria**: No se puede cerrar una OT sin subir al menos una foto de evidencia y la firma del cliente.
3.  **Audit Log**: Cada cambio de estado y movimiento de mercadería queda grabado con fecha y usuario responsable.

---

## ✅ Conclusión del Diagnóstico
Tras revisar el código y la base de datos: **EL SISTEMA ESTÁ OK.**
La estructura es modular, la seguridad es robusta y los flujos cubren desde la planificación estratégica hasta la ejecución táctica en campo.
hic