import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import * as reportesRepo from './reportes.repo';
import { MailService } from '../../common/services/mail.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';

@Controller('inv/reportes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERVISOR', 'AUDITOR', 'TECNICO', 'DESPACHO', 'BODEGA')
export class ReportesController {
  constructor(private mailService: MailService) { }

  @Get('dashboard')
  async getDashboard(@Request() req: any) {
    return await reportesRepo.getDashboardMetrics(
      req.user.userId,
      req.user.roleId,
    );
  }

  @Get('consumo-proyecto')
  async getConsumoProyecto(
    @Query('idProyecto') idProyecto?: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    return await reportesRepo.reporteConsumoPorProyecto(
      idProyecto ? parseInt(idProyecto) : undefined,
      fechaInicio ? new Date(fechaInicio) : undefined,
      fechaFin ? new Date(fechaFin) : undefined,
    );
  }

  @Get('sla')
  async getSLA(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    return await reportesRepo.reporteSLA(
      fechaInicio ? new Date(fechaInicio) : undefined,
      fechaFin ? new Date(fechaFin) : undefined,
    );
  }

  @Get('stock-bajo')
  async getStockBajo(@Query('almacenId') almacenId?: string) {
    return await reportesRepo.reporteStockBajo(
      almacenId ? parseInt(almacenId) : undefined,
    );
  }

  @Post('notificar-stock-bajo')
  async notificarStockBajo(@Query('almacenId') almacenId?: string) {
    const itemsBajo = await reportesRepo.reporteStockBajo(
      almacenId ? parseInt(almacenId) : undefined,
    );

    let alertsSent = 0;
    for (const item of itemsBajo) {
      await this.mailService.sendStockAlert(
        item.producto,
        item.stockActual,
        item.stockMinimo,
        item.almacen,
      );
      alertsSent++;
    }

    return {
      message: `Proceso de notificación completado.`,
      alertasEnviadas: alertsSent,
      detalles: itemsBajo.length,
    };
  }

  @Get('consumo-tecnico')
  async getConsumoTecnico(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    return await reportesRepo.reporteConsumoPorTecnico(
      fechaInicio ? new Date(fechaInicio) : undefined,
      fechaFin ? new Date(fechaFin) : undefined,
    );
  }

  @Get('activos-estado')
  async getActivosEstado() {
    return await reportesRepo.reporteActivosEstado();
  }

  @Get('mi-stock')
  async getMiStock(@Request() req: any) {
    return await reportesRepo.reporteMiStock(req.user.userId);
  }

  @Post('ajustar-stock')
  async ajustarStock(@Body() dto: any) {
    return await reportesRepo.ajustarStock(dto);
  }

  @Get('consumo-tecnico-diario')
  async getConsumoTecnicoDiario(@Query('fecha') fecha: string) {
    return await reportesRepo.reporteDetalleTecnicoDiario(fecha);
  }
}
