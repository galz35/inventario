import { Controller, Get, Post, Body, Query, UseGuards, Param } from '@nestjs/common';
import * as consignacionRepo from './consignacion.repo';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';

@Controller('inv/consignacion')
@UseGuards(JwtAuthGuard)
export class ConsignacionController {
  @Get('calcular')
  async calcularLiquidacion(
    @Query('proveedorId') proveedorId: string,
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
  ) {
    return await consignacionRepo.calcularLiquidacion(
      parseInt(proveedorId),
      new Date(fechaInicio),
      new Date(fechaFin),
    );
  }

  @Post('procesar')
  async procesarLiquidacion(@Body() dto: any) {
    return await consignacionRepo.procesarLiquidacion({
      ...dto,
      fechaInicio: new Date(dto.fechaInicio),
      fechaFin: new Date(dto.fechaFin),
    });
  }

  @Get('liquidaciones')
  async getLiquidaciones() {
    return await consignacionRepo.obtenerLiquidaciones();
  }

  @Get('proveedor/:id/resumen')
  async getResumenProveedor(@Param('id') id: string) {
    return await consignacionRepo.obtenerResumenProveedor(parseInt(id));
  }
}
