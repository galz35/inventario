import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import * as auditRepo from './inv_audit.repo';

@Controller('inv/auditoria')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditoriaController {

  @Get('conteos')
  async listarConteos() {
    return await auditRepo.listarConteos();
  }

  @Post('iniciar')
  @Roles('ADMIN', 'SUPERVISOR', 'BODEGA')
  async iniciar(@Body() dto: any, @Request() req: any) {
    return await auditRepo.iniciarConteo(
      dto.almacenId,
      req.user.idUsuario,
      dto.nombre || dto.notas
    );
  }

  @Post('conciliar')
  @Roles('ADMIN', 'SUPERVISOR')
  async conciliar(@Body() dto: any, @Request() req: any) {
    // This is the new method for bulk reconciliation from frontend
    return await auditRepo.conciliarAuditoria({
      ...dto,
      idUsuario: req.user.idUsuario
    });
  }

  @Get('cierres')
  async listarCierres() {
    return await auditRepo.listarCierresMensuales();
  }

  @Post('cierre-mensual')
  @Roles('ADMIN')
  async generarCierre(@Body() dto: any, @Request() req: any) {
    return await auditRepo.generarCierreMensual({
      ...dto,
      idUsuario: req.user.idUsuario
    });
  }
}
