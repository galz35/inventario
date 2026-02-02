import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { InvModulesModule } from './inv_modules/inv_modules.module';
import { DbModule } from './db/db.module';

// Modulo LIMPIO - Solo carga lo esencial para el Sistema de Inventario
// Se han eliminado módulos legacy (InventarioCore, Planning antiguo, Admin antiguo, Acceso antiguo)

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DbModule, // Conexión SQL Server

    // Modulos Principales del Nuevo Sistema
    InvModulesModule,
    AuthModule,

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 100,
      },
    ]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
