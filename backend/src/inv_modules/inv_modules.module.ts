import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { InventarioController } from './inventario/inventario.controller';
import { OperacionesController } from './operaciones/operaciones.controller';
import { ActivosController } from './activos/activos.controller';
import { ReportesController } from './inventario/reportes.controller';
import { AuditoriaController } from './inventario/audit.controller';
import { ConsignacionController } from './inventario/consignacion.controller';
import { InvAuthController } from './auth/inv_auth.controller';
import { CatalogosController } from './catalogos/catalogos.controller';
import { PlanificacionController } from './operaciones/planificacion.controller';
import { MailService } from '../common/services/mail.service';
import { StorageService } from '../common/services/storage.service';
import { ExcelService } from '../common/services/excel.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'secretKey',
        signOptions: { expiresIn: '12h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    InventarioController,
    OperacionesController,
    ActivosController,
    ReportesController,
    AuditoriaController,
    ConsignacionController,
    InvAuthController,
    CatalogosController,
    PlanificacionController,
  ],
  providers: [MailService, StorageService, ExcelService],
  exports: [MailService, StorageService, ExcelService],
})
export class InvModulesModule {}
