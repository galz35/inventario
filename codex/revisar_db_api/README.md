# REVISIÓN DE BASE DE DATOS Y API - CODEX

Este directorio contiene una exportación completa de la estructura de la base de datos y un análisis de las consultas SQL encontradas en el código fuente.

## Contenido:
1. **db_structure/Tables/**: Definiciones SQL (CREATE TABLE) de todas las tablas encontradas en la base de datos `Bdplaner`.
2. **db_structure/Procedures/**: Código fuente (CREATE PROCEDURE) de todos los procedimientos almacenados, incluyendo el prefijo `Inv_` y `sp_`.
3. **api_queries.txt**: Listado de todas las consultas SQL embebidas e invocaciones a procedimientos almacenados extraídas directamente de los archivos `.ts` y `.js` del backend.

## Notas Técnicas:
- La exportación fue realizada conectándose a la base de datos configurada en el servidor.
- Se han incluido todas las tablas y procedimientos sin omisiones.
- Las consultas del código fuente incluyen el archivo de origen para facilitar su rastreo.

Fecha de exportación: 2026-02-04
