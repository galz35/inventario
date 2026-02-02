import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import * as auditRepo from './inv_audit.repo';

@Controller('inv/auditoria')
export class AuditoriaController {
  @Get('conteos')
  async listarConteos() {
    return await auditRepo.listarConteos();
  }

  @Post('conteo/iniciar')
  async iniciarConteo(
    @Body() dto: { almacenId: number; idUsuario: number; notas?: string },
  ) {
    return await auditRepo.iniciarConteo(
      dto.almacenId,
      dto.idUsuario,
      dto.notas,
    );
  }

  @Post('conteo/:id/item')
  async registrarItem(
    @Param('id') id: string,
    @Body() dto: { productoId: number; stockFisico: number },
  ) {
    return await auditRepo.registrarItemConteo(
      parseInt(id),
      dto.productoId,
      dto.stockFisico,
    );
  }

  @Post('conteo/:id/finalizar')
  async finalizarConteo(
    @Param('id') id: string,
    @Body() dto: { idUsuario: number },
  ) {
    return await auditRepo.finalizarConteo(parseInt(id), dto.idUsuario);
  }
}
