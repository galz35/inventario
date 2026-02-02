import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import * as activosRepo from './activos.repo';

@Controller('inv/activos')
@UseGuards(JwtAuthGuard)
export class ActivosController {

  @Get('buscar')
  async buscar(@Query('serial') serial: string) {
    if (!serial) return null;
    const resultados = await activosRepo.buscarActivoPorSerie(serial);
    return resultados[0] || null; // Retorna el primer match o null
  }
}
