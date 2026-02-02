import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

// NOTA: Endpoints de seed/test deshabilitados temporalmente durante migración MSSQL
// Usaban sintaxis PostgreSQL ($1, $2...) incompatible con SQL Server

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('reset-passwords')
  async resetPasswords() {
    return {
      message:
        'Endpoint deshabilitado durante migración. Usar SSMS para reset manual.',
      sql: "UPDATE Inv_seg_usuariosCredenciales SET passwordHash = '<bcrypt_hash>' WHERE 1=1",
    };
  }

  @Get('seed-test-tasks')
  async seedTestTasks() {
    return {
      message: 'Seed endpoints deshabilitados. Usar scripts SQL directamente.',
    };
  }

  @Get('seed-completed-tasks')
  async seedCompletedTasks() {
    return {
      message: 'Seed endpoints deshabilitados. Usar scripts SQL directamente.',
    };
  }

  @Get('seed-all-states')
  async seedAllStates() {
    return {
      message: 'Seed endpoints deshabilitados. Usar scripts SQL directamente.',
    };
  }

  @Get('rrhh-users')
  async getRRHH() {
    return { message: 'Endpoint legacy deshabilitado.' };
  }

  @Get('setup-db')
  async setupDatabase() {
    const fs = require('fs');
    const path = require('path');
    const { ejecutarQuery } = require('./db/base.repo');

    try {
      const sqlPath = 'd:\\inventario\\docs\\diseno_db_fase1.sql'; // Ruta absoluta confirmada
      if (!fs.existsSync(sqlPath))
        return { error: 'SQL File Not Found', path: sqlPath };

      const content = fs.readFileSync(sqlPath, 'utf8');
      const batches = content.split(/^GO/gm);

      let success = 0;
      let errors = 0;

      for (const batch of batches) {
        const q = batch.trim();
        if (q) {
          try {
            await ejecutarQuery(q);
            success++;
          } catch (e) {
            // Ignorar errores de existencia
            if (!JSON.stringify(e).includes('already exists')) errors++;
          }
        }
      }

      // REPARACIÓN DE ESQUEMA (Fix Schema)
      // Asegurar columnas críticas para Auth
      try {
        await ejecutarQuery(
          'ALTER TABLE Inv_seg_usuarios ADD password NVARCHAR(255) NULL',
        );
      } catch (e) {}
      try {
        await ejecutarQuery(
          'ALTER TABLE Inv_seg_usuarios ADD refreshToken NVARCHAR(MAX) NULL',
        );
      } catch (e) {}
      try {
        await ejecutarQuery(
          'ALTER TABLE Inv_seg_usuarios ADD ultimoAcceso DATETIME NULL',
        );
      } catch (e) {}

      try {
        await ejecutarQuery(
          'ALTER TABLE Inv_seg_roles ADD esSistema BIT DEFAULT 0',
        );
      } catch (e) {}
      try {
        await ejecutarQuery(
          'ALTER TABLE Inv_seg_roles ADD reglas NVARCHAR(MAX) NULL',
        );
      } catch (e) {}
      try {
        await ejecutarQuery(
          'ALTER TABLE Inv_seg_roles ADD defaultMenu NVARCHAR(MAX) NULL',
        );
      } catch (e) {}

      // Seed User
      // Crear rol admin si no existe
      await ejecutarQuery(`
            IF NOT EXISTS (SELECT 1 FROM Inv_seg_roles WHERE nombre = 'ADMIN')
            INSERT INTO Inv_seg_roles (nombre, descripcion, esSistema, reglas) VALUES ('ADMIN', 'Admin', 1, '["*"]')
          `);

      // Crear usuario Diana
      // Hash dummy para bypass (si backend valida bcrypt debe coincidir lógica)
      // Asumiremos que generamos uno válido o desactivamos check si es dev
      // O usamos el que el backend genere.

      // Para que el login funcione REALMENTE, el hash debe ser válido para bcrypt.
      // Generaremos uno usando el modulo bcrypt del proyecto.
      const bcrypt = require('bcrypt');
      const hash = await bcrypt.hash('123456', 10);

      await ejecutarQuery(`
            DECLARE @idRolAdmin INT = (SELECT TOP 1 idRol FROM Inv_seg_roles WHERE nombre = 'ADMIN');
            
            IF NOT EXISTS (SELECT 1 FROM Inv_seg_usuarios WHERE correo = 'diana.martinez@empresa.com')
            BEGIN
                INSERT INTO Inv_seg_usuarios (nombre, correo, carnet, password, idRol, activo, ultimoAcceso)
                VALUES ('Diana Martinez', 'diana.martinez@empresa.com', 'ADM001', '${hash}', @idRolAdmin, 1, GETDATE());
            END
            ELSE
            BEGIN
                 -- Update password to ensure login works
                 UPDATE Inv_seg_usuarios SET password = '${hash}', idRol = @idRolAdmin, activo=1 WHERE correo = 'diana.martinez@empresa.com';
            END
          `);

      // Seed Datos Operativos (Para Tests)
      await ejecutarQuery(`
             -- Cliente Dummy
             IF NOT EXISTS (SELECT 1 FROM Inv_cat_clientes WHERE nombre = 'Cliente Test')
                INSERT INTO Inv_cat_clientes (nombre, direccion, telefono, email, activo) 
                VALUES ('Cliente Test', 'Calle Test 123', '555-0000', 'cliente@test.com', 1);

             -- Tipo OT Dummy
             IF NOT EXISTS (SELECT 1 FROM Inv_cat_tipos_ot WHERE nombre = 'Instalacion Basica')
                INSERT INTO Inv_cat_tipos_ot (nombre, descripcion, slaHoras, prioridadDefault, requiereFirma, requiereEvidencia, activo) 
                VALUES ('Instalacion Basica', 'Instalacion simple', 48, 'MEDIA', 0, 0, 1);

             -- Proyecto Dummy
             IF NOT EXISTS (SELECT 1 FROM Inv_ope_proyectos WHERE nombre = 'Proyecto Demo Fibra')
             BEGIN
                DECLARE @idUser INT = (SELECT TOP 1 idUsuario FROM Inv_seg_usuarios WHERE correo = 'diana.martinez@empresa.com');
                INSERT INTO Inv_ope_proyectos (nombre, descripcion, idResponsable, estado, fechaInicio, fechaFin)
                VALUES ('Proyecto Demo Fibra', 'Proyecto de prueba automatica', @idUser, 'ACTIVO', GETDATE(), DATEADD(day, 30, GETDATE()));
             END
          `);

      // Creación de Tablas de Sistema (Logs/Auditoría) si faltan
      await ejecutarQuery(`
             IF OBJECT_ID('Inv_sis_logs', 'U') IS NULL
             CREATE TABLE Inv_sis_logs (
                idLog INT IDENTITY(1,1) PRIMARY KEY,
                idUsuario INT NULL,
                accion NVARCHAR(100),
                entidad NVARCHAR(100),
                datos NVARCHAR(MAX),
                fecha DATETIME DEFAULT GETDATE()
             );

             IF OBJECT_ID('Inv_sis_auditoria', 'U') IS NULL
             CREATE TABLE Inv_sis_auditoria (
                idAuditoria INT IDENTITY(1,1) PRIMARY KEY,
                idUsuario INT NULL,
                accion NVARCHAR(100),
                entidad NVARCHAR(100),
                entidadId NVARCHAR(50),
                datosAnteriores NVARCHAR(MAX),
                datosNuevos NVARCHAR(MAX),
                fecha DATETIME DEFAULT GETDATE()
             );
          `);

      return {
        success: true,
        batchesApplied: success,
        errorsIgnored: errors,
        message: 'DB setup complete & Admin user ready',
      };
    } catch (e: any) {
      return { error: e.message, stack: e.stack };
    }
  }
}
