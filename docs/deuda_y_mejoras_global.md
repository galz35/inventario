# PLAN DE MEJORA Y DEUDA TÉCNICA GLOBAL (INVCORE)

Este documento complementa el informe de precisión de inventario, enfocándose en la robustez, escala y experiencia de usuario del sistema completo.

## 1. INFRAESTRUCTURA Y SEGURIDAD
- **Almacenamiento Real de Evidencias**: 
    - *Estado Actual*: El backend recibe la intención de carga, pero no guarda archivos físicos en disco o nube (AWS S3/Azure Blob).
    - *Mejora*: Implementar un servicio de Storage para fotos de instalación y firmas reales.
- **Seguridad JWT Robusta**:
    - *Estado Actual*: Tokens simples.
    - *Mejora*: Implementar `Refresh Tokens` y rotación de llaves para evitar que una sesión robada sea eterna.
- **Capa de Validación (DTOs)**:
    - *Estado Actual*: El backend confía en que el frontend envía datos correctos.
    - *Mejora*: Implementar `class-validator` en NestJS para rechazar peticiones mal formadas antes de que lleguen a la base de datos.

## 2. EXPERIENCIA DEL TÉCNICO (MOVILIDAD)
- **Modo Offline (Sin Conexión)**:
    - *Estado Actual*: Requiere internet constante.
    - *Mejora*: Implementar `Service Workers` (PWA) para que el técnico pueda registrar consumos en zonas sin señal y se sincronicen al recuperar conexión.
- **Escaneo de Códigos de Barras/QR**:
    - *Estado Actual*: Entrada manual de códigos.
    - *Mejora*: Integrar la cámara del celular para entrada rápida de productos y activos serializados.
- **Geolocalización de Cierre**:
    - *Mejora*: Capturar las coordenadas GPS exactas al momento de cerrar una OT para auditar que el técnico realmente estuvo en el domicilio del cliente.no se realizara por lo menos no contamos con un servidor con ssl para geolocalizacion que te pide el navegador.

## 3. LÓGICA DE NEGOCIO AVANZADA
- **Gestión de Mínimos y Máximos Automática**:
    - *Mejora*: Que el sistema sugiera órdenes de compra basadas en la velocidad de consumo de los últimos 3 meses (Stock Inteligente).
- **Módulo de Garantías**:
    - *Mejora*: Controlar el tiempo de garantía de los equipos instalados (ONT/Router) para saber si un cambio debe cobrarse al proveedor o al cliente.
- **Notificaciones Multi-canal**:
    - *Mejora*: Alertas por Correo/WhatsApp cuando un stock baje del nivel crítico o cuando se asigne una OT urgente.correo nada mas porque whatsapp es complicado y vamos a probar con correo gmail como sistema tengo correo para probar.

## 4. CALIDAD DE CÓDIGO (MANTENIBILIDAD)
- **Pruebas Automatizadas**:
    - *Estado Actual*: 0% cobertura de tests.
    - *Mejora*: Crear Unit Tests para los servicios críticos de cálculo de liquidación y movimientos de stock.
- **Documentación de API (Swagger)**:
    - *Estado Actual*: Base técnica instalada.
    - *Mejora*: Decorar todos los endpoints para que cualquier desarrollador nuevo entienda el API sin leer el código fuente.
- **Logs de Auditoría de Aplicación**:
    - *Mejora*: Centralizar logs de errores (Sentry) para detectar fallos en producción antes de que el usuario los reporte.

## 📈 RESUMEN DE PRIORIDADES
1. **Prioridad 1 (Urgente)**: Validación de datos y almacenamiento real de archivos.
2. **Prioridad 2 (Operativa)**: Escaneo QR y Modo Offline para técnicos.
3. **Prioridad 3 (Estratégica)**: Stock inteligente y Notificaciones.
