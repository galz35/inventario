# Plan de Validación y Ajuste de APIs (V1)

## Resumen Ejecutivo
Este documento detalla el plan sistemático para validar, probar y corregir la integración entre el Backend (NestJS) y el Frontend (React). El objetivo principal es resolver los problemas de "Login" y "Parseo de JSON" reportados, asegurando que los contratos de datos (Request/Response) sean consistentes.

## Estrategia de Trabajo
1.  **Análisis Estático**: Revisar código Frontend y Backend para identificar discrepancias en nombres de campos y estructuras.
2.  **Prueba Funcional**: Ejecutar scripts de prueba que simulen exactamente el payload del Frontend.
3.  **Corrección**: Ajustar el Frontend (o Backend si es crítico) para alinear los contratos.
4.  **Validación**: Confirmar funcionamiento E2E.

---

## Fase 1: Autenticación y Seguridad (PRIORIDAD ALTA)
> **Estado Actual**: **EN PROCESO**. Corrección aplicada en Frontend.

| Endpoint | Método | Payload Frontend (Envío) | Esperado Backend | Respuesta Backend | Consumo Frontend (Recepción) | Estado | Corrección Realizada |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/auth/login` | POST | `{ correo, password }` | `{ correo, password }` | `{ success: true, data: { access_token... } }` | Esperaba `res.data.token`. | ✅ Corregido | Frontend actualizado para leer `access_token`. |

## Fase 2: Catálogos e Inventario Base
> **Estado**: **VALIDADO**. Backend devuelve nombres correctos (`productoNombre`, `almacenNombre`) que coinciden con Frontend.

| Endpoint | Método | Estado | Notas |
| :--- | :--- | :--- | :--- |
| `/inv/inventario/stock` | GET | ✅ Validado | Campos coinciden (`almacenNombre`, `productoCodigo`, `cantidad`). |
| `/inv/catalogos/clientes` | GET | ✅ Validado | Campos coinciden (Estándar SP `Inv_sp_cat_listar`). |
| `/inv/catalogos/tipos-ot` | GET | ✅ Validado | Campos coinciden (Estándar SP `Inv_sp_cat_listar`). |
| `/inv/planificacion/proyectos` | GET | ✅ Validado | Campos `nombre`, `estado` coinciden. |
| `/inv/planificacion/proyectos/:id/wbs` | GET | ✅ Validado | Campos `idTarea`, `nombre`, `estado` coinciden. |

## Fase 3: Operaciones (OTs)
> **Estado**: **VALIDADO Y CORREGIDO**. Backend alineado con Frontend.

| Endpoint | Campo Frontend | Campo Backend (Corregido) | Resultado |
| :--- | :--- | :--- | :--- |
| `/inv/operaciones/ot` | `ot.tipo` | `tipo` (Alias de `tipoOT`) | ✅ Coincide |
| `/inv/operaciones/ot` | `ot.tecnico` | `tecnico` (Nombre de Usuario) | ✅ Coincide (JOIN agregado) |
| `/inv/operaciones/ot` | `ot.clienteNombre` | `clienteNombre` | ✅ Coincide |

## Fase 4: Reportes y Dashboard
> **Estado**: **VALIDADO**. Backend corregido para retornar objeto único.

| Endpoint | Método | Respuesta Backend (Actual) | Consumo Frontend | Estado |
| :--- | :--- | :--- | :--- | :--- |
| `/inv/reportes/dashboard` | GET | `{ ... }` | `res.data.data` | ✅ Validado |

---

## Conclusiones y Siguientes Pasos
1.  **Frontend Auth**: Se corrigió el acceso a `access_token` en `AuthView.tsx`.
2.  **Backend OTs**: Se actualizaron SPs `Inv_sp_ot_listar_tecnico` y `Inv_sp_ot_listar_filtro` para incluir nombres de técnicos y alias de tipo.
3.  **General**: El manejo de `res.data.data` es consistente en la mayoría de vistas.

**Estado Final**: El sistema debería permitir Login y Operaciones básicas correctamente.


