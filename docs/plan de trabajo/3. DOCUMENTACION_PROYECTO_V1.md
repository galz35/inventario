# 📋 Documentación de Proyecto: INVCORE (V1.0)

## 📌 Introducción
INVCORE es un sistema integral de gestión de inventarios, activos y operaciones técnicas diseñado para alta disponibilidad y robustez en entornos críticos.

---

## 🔑 Credenciales de Acceso (Demo)
*   **Contraseña Maestra:** `123456`
*   **Perfiles:**
    *   `miguel.torres@empresa.com` (Administrador)
    *   `sofia.lopez@empresa.com` (Supervisor)
    *   `carlos.paredes@empresa.com` (Técnico)
    *   `roberto.central@empresa.com` (Bodega)

---

## 🚀 Arquitectura del Sistema

### 🎨 Frontend (React + Vite)
*   **Estética:** Premium Dark Mode con Glassmorphism.
*   **Componentes Clave:**
    *   `DataTable`: Tablas inteligentes con filtrado y exportación CSV.
    *   `WorkloadView`: Gestión de técnicos con vista dual (Tabla/Calendario).
    *   `Modals`: Dual-mode (Asignación existente / Creación rápida).

### ⚡ Backend (NestJS + Fastify)
*   **Seguridad:** Validación mediante JWT y Roles Guard por ruta.
*   **Resiliencia:** Lógica Híbrida (Intenta usar Procedimientos Almacenados y cae a Query Inline como respaldo automático).
*   **Observabilidad:** Captura de consultas lentas (>1s) para optimización técnica.

### 🗄️ Base de Datos (SQL Server)
*   **Estructura:** Relacional con lógica de negocio centralizada en Procedimientos Almacenados (SPs).
*   **Módulos:** Inventario, Operaciones (OTs), Catálogos y Seguridad.

---

## 🛠️ Flujos Principales Operativos

1.  **Gestión de Inventario:** Entradas, salidas y transferencias directas entre bodegas con trazabilidad de Kardex completa.
2.  **Operaciones Técnicas:** Flujo completo desde la creación de la OT, pasando por la asignación inteligente, hasta el cierre técnico con firma y reporte de consumo.
3.  **Supervisión de Carga:** Visualización en tiempo real de la disponibilidad de cuadrillas mediante mapa de calendario interactivo.

---

## 📦 Entrega Técnica
Para asegurar la estabilidad, se han incluido scripts de corrección en la carpeta `backend\src\db\scripts\`. Se recomienda ejecutar `FIX_SPs_PRESENTACION.sql` antes de la salida a producción para optimizar el rendimiento de la DB.

---
*Documentación generada para la presentación del equipo de desarrollo.*
