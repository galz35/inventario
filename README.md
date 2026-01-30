# Sistema de Inventario y Operaciones (Prefijo Inv_)

Este sistema gestiona el inventario, órdenes de trabajo (OT), activos serializados y auditoría para empresas de telecomunicaciones y servicios de campo.

## 🚀 Guía de Inicio Rápido

### 1. Base de Datos (SQL Server)
Ejecute el script de inicialización completo para crear tablas, procedimientos y datos iniciales:
- Ubicación: `docs/diseno_db_fase1.sql`
- Requisito: SQL Server 2016+

### 2. Backend (NestJS)
El backend está diseñado siguiendo el principio de **Stored Procedures First**.
```bash
cd backend
npm install
npm run dev
```
- API Base: `http://localhost:3000/api`
- Módulos Principales: `src/inv_modules/`

### 3. Frontend (Vite + React)
Diseño premium optimizado para dispositivos móviles (técnicos en campo).
```bash
cd frontend
npm install
npm run dev
```

## 🛠️ Tecnologías
- **Backend**: NestJS, SQL Server (mssql).
- **Frontend**: Vite, React, CSS Variables (Design System).
- **Base de Datos**: T-SQL (SPs, Transactions, Try-CATCH).

## 📋 Módulos Implementados
1. **Seguridad**: Autenticación, Roles y Permisos.
2. **Almacenes**: Jerarquía de bodegas y camionetas de técnicos.
3. **Inventario**: Kardex, Transferencias, Ajustes.
4. **Operaciones**: Gestión de Proyectos y OTs.
5. **Activos**: Control de equipos serializados y reparaciones.
6. **Consignación**: Liquidación de pagos a proveedores por consumo.
7. **Auditoría**: Conteo físico con ajuste automático de stock.
8. **Reportes**: SLA, Stock Bajo, Consumo por Técnico.
