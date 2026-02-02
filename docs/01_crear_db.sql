/*
================================================================================
SCRIPT DE CREACIÓN DE BASE DE DATOS E INSTALACIÓN - SISTEMA INV
================================================================================
Este script crea la base de datos 'inventario' y prepara el entorno.
================================================================================
*/

USE master;
GO

-- 1. Crear la base de datos si no existe
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'inventario')
BEGIN
    CREATE DATABASE inventario;
    PRINT '✅ Base de datos "inventario" creada exitosamente.';
END
ELSE
BEGIN
    PRINT 'ℹ️ La base de datos "inventario" ya existe.';
END
GO

USE inventario;
GO

/* 
   A CONTINUACIÓN SE DEBE EJECUTAR EL CONTENIDO DE: d:\inventario\docs\diseno_db_fase1.sql
   PARA CREAR TODA LA ESTRUCTURA DEL SISTEMA EN LA NUEVA BASE.
*/
