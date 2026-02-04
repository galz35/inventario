import { Controller, Get, Post, Body, Query, UseGuards, Request, Delete, Param, BadRequestException } from '@nestjs/common';
import { Roles } from '../../auth/roles.decorator';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import * as activosRepo from './activos.repo';

@Controller('inv/activos')
@UseGuards(JwtAuthGuard)
export class ActivosController {

  @Get()
  async listar(@Query('q') texto?: string, @Query('estado') estado?: string) {
    return await activosRepo.listarActivos({ texto, estado });
  }

  @Get('buscar')
  async buscar(@Query('serial') serial: string) {
    if (!serial) return null;
    const resultados = await activosRepo.buscarActivoPorSerie(serial);
    return resultados[0] || null; // Retorna el primer match o null
  }

  @Get(':id/historial')
  async historial(@Param('id') id: string) {
    return await activosRepo.obtenerHistorialActivo(parseInt(id));
  }

  @Post('asignar')
  @Roles('ADMIN', 'SUPERVISOR', 'BODEGA')
  async asignar(@Body() body: { idActivo: number, idTecnico?: number, idAlmacen?: number, notas?: string }, @Request() req: any) {
    if (!body.idActivo) throw new BadRequestException('ID Activo requerido');
    return await activosRepo.asignarActivo({
      ...body,
      idUsuarioAsigna: req.user.userId
    });
  }

  @Post()
  @Roles('ADMIN', 'SUPERVISOR', 'BODEGA')
  async crear(@Body() body: any, @Request() req: any) {
    return await activosRepo.crearActivo({
      ...body,
      idUsuarioRegistra: req.user.userId
    });
  }

  @Delete(':id')
  @Roles('ADMIN', 'SUPERVISOR', 'BODEGA')
  async eliminar(@Param('id') id: string, @Request() req: any) {
    return await activosRepo.eliminarActivo(parseInt(id), req.user.userId);
  }
}
