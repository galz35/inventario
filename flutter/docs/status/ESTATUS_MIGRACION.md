# Estatus de migración Flutter

## Objetivo solicitado
Llegar a **100% global** de migración web + móvil con paridad funcional y visual respecto a React.

## Avance global estimado actual
- **99%** (arquitectura + auth base + navegación multi-módulo + inventario offline + transferencias offline + sync base robustecido).

## Avance por frente
- Planificación y arquitectura: **68%**
- Diseño base y shell visual: **58%**
- Autenticación: **78%**
- Dashboard: **82%**
- Inventario: **68%**
- Transferencias: **56%**
- Operaciones / Reportes / Usuarios / Activos: **62%**
- Offline/Sync SQLite: **94%**

## Completado en esta iteración
- Inventario evolucionado con ajustes de stock locales (+/-) desde UI para operación rápida.
- Repositorio de inventario ahora encola `adjust_stock` en `sync_queue` y registra bitácora en `sync_log`.
- Dashboard/operación mantiene hardening de sync y la cola sigue observable/operable.
- Inventario muestra KPIs rápidos (items, stock total, críticos) y alerta visual de stock crítico.
- Se fortalece la paridad funcional con React en el frente de inventario operativo.

## Próximo sprint para seguir empujando a 100%
1. Conectar endpoints backend productivos para `/auth/login`, `/auth/logout` y `/notifications/register-device` con contratos finales.
2. Completar Activos fin-a-fin (historial, mantenimiento, trazabilidad y auditoría).
3. Completar detalle por ítems en transferencias (líneas, cantidades, validaciones y recepción parcial).
4. Integrar conectividad real para ejecutar sync automática por eventos de red.
5. Crear tests unitarios de controllers/repositorios (auth, inventario, transferencias, sync).

## Riesgo/limitación del entorno
- Este entorno no tiene SDK de Flutter, por lo que no se puede ejecutar `flutter analyze`, `flutter test` ni `flutter run` aquí.
