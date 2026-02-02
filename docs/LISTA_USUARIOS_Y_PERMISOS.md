# 👥 LISTADO DE USUARIOS Y ACCESOS DEL SISTEMA INVCORE

Este documento detalla los usuarios configurados, sus roles y las páginas a las que tienen acceso según la lógica del Frontend (`App.tsx`) y Backend.

---

## 🔐 Credencial Genérica
**Contraseña para todos:** `123456`

---

## 1. 🥇 MIGUEL TORRES (Administrador)
* **Correo:** `miguel.torres@empresa.com`
* **Perfil:** `ADMINISTRADOR` (o `ADMIN`)
* **Acceso:** **TOTAL (Ver todo)**

### 👁️ Páginas Visibles:
| Icono | Menú | Descripción |
| :--- | :--- | :--- |
| 📊 | **Inicio** | Dashboard General (KPIs financieros y operativos) |
| 📦 | **Invetario** | Stock Global, Traslados, Consignaciones |
| 📋 | **Operaciones** | Planificación, Órdenes OT, Reportes y KPIs |
| ⚙️ | **Sistema** | Activos y Herramientas, Almacenes, Catálogos |

---

## 2. 📋 SOFIA LOPEZ (Supervisora / Despacho)
* **Correo:** `sofia.lopez@empresa.com`
* **Perfil:** `SUPERVISOR` (o `DESPACHO`)
* **Acceso:** Gestión Operativa y Control de Inventario

### 👁️ Páginas Visibles:
| Icono | Menú | Descripción |
| :--- | :--- | :--- |
| 📊 | **Inicio** | Dashboard Operativo |
| 📦 | **Inventario** | Stock Global, Traslados, Consignaciones |
| 📅 | **Operaciones** | Planificación (Cronograma), Órdenes OT (Asignar), Reportes |
| ❌ | *Sistema* | *NO tiene acceso a configuración global (Catálogos, Almacenes)* |

---

## 3. 🛠️ CARLOS PAREDES (Técnico de Campo)
* **Correo:** `carlos.paredes@empresa.com` (o usuario `c` para acceso rápido)
* **Perfil:** `TECNICO`
* **Acceso:** Ejecución y Mi Inventario

### 👁️ Páginas Visibles:
| Icono | Menú | Descripción |
| :--- | :--- | :--- |
| 📊 | **Inicio** | Dashboard Personal |
| 📋 | **Operaciones** | Mis Órdenes (Solo ver y ejecutar sus OTs) |
| 🛠️ | **Mis Herramientas** | Ver activos asignados a su cargo |
| 🚚 | **Traslados / Pedidos** | Solicitar material o ver traslados entrantes |
| ❌ | *Inventario* | *NO ve el stock global ni consignaciones* |
| ❌ | *Sistema/Reportes* | *NO ve reportes gerenciales ni configuración* |

---

## 4. 📦 ROBERTO CENTRAL (Jefe de Bodega)
* **Correo:** `roberto.central@empresa.com`
* **Perfil:** `BODEGA`
* **Acceso:** Gestión de Inventario Físico

### 👁️ Páginas Visibles:
| Icono | Menú | Descripción |
| :--- | :--- | :--- |
| 📊 | **Inicio** | Dashboard de Bodega |
| 📦 | **Inventario** | Stock Global (Control total), Traslados, Consignaciones |
| ❌ | *Operaciones* | *NO ve OTs ni Planificación* |
| ❌ | *Sistema* | *NO ve configuración global* |

---

##  RESUMEN DE PERMISOS TÉCNICOS (`App.tsx`)

| Rol (BD) | Admin View | Inv View | Ops View | Plan View | Reps View | System View |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **ADMIN** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **SUPERVISOR** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **BODEGA** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **TECNICO** | ✅ | ❌ | ✅ (Limitado) | ❌ | ❌ | ❌ |

*Nota: Todos ven "Inicio" (Dashboard).*
