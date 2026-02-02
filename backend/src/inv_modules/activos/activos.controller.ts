import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import * as activosRepo from './activos.repo';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';

@Controller('inv/activos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActivosController {
  @Get()
  @Roles('ADMIN', 'AUDITOR', 'SUPERVISOR', 'TECNICO')
  async listarActivos(
    @Query('estado') estado?: string,
    @Query('idAlmacen') idAlmacen?: string,
    @Query('idTecnico') idTecnico?: string,
    @Query('buscar') buscar?: string,
  ) {
    return await activosRepo.listarActivos({
      estado,
      idAlmacen: idAlmacen ? parseInt(idAlmacen) : undefined,
      idTecnico: idTecnico ? parseInt(idTecnico) : undefined,
      buscar,
    });
  }

  @Post()
  @Roles('ADMIN', 'SUPERVISOR')
  async crearActivo(
    @Body()
    dto: {
      serial: string;
      idProducto: number;
      idAlmacen?: number;
      estado?: string;
    },
  ) {
    return await activosRepo.crearActivo(dto);
  }

  @Post('asignar')
  @Roles('ADMIN', 'SUPERVISOR')
  async asignarActivo(
    @Body() dto: { idActivo: number; idTecnico: number; notas?: string },
    @Request() req: any,
  ) {
    return await activosRepo.asignarActivoATecnico(
      dto.idActivo,
      dto.idTecnico,
      req.user.userId,
      dto.notas,
    );
  }

  @Post('reparacion/enviar')
  @Roles('ADMIN', 'SUPERVISOR', 'TECNICO')
  async enviarReparacion(
    @Body() dto: { idActivo: number; diagnostico: string },
    @Request() req: any,
  ) {
    return await activosRepo.enviarAReparacion(
      dto.idActivo,
      dto.diagnostico,
      req.user.userId,
    );
  }

  @Post('reparacion/recibir')
  @Roles('ADMIN', 'SUPERVISOR')
  async recibirReparacion(@Body() dto: any) {
    return await activosRepo.recibirReparacion(dto);
  }

  @Post('devolver')
  @Roles('ADMIN', 'TECNICO')
  async devolverActivo(
    @Body() dto: { idActivo: number; idAlmacenDestino: number; notas?: string },
    @Request() req: any,
  ) {
    return await activosRepo.devolverActivo(
      dto.idActivo,
      dto.idAlmacenDestino,
      req.user.userId,
      dto.notas,
    );
  }

  @Post('reemplazar-ot')
  @Roles('ADMIN', 'TECNICO')
  async reemplazarActivoOT(@Body() dto: any) {
    return await activosRepo.reemplazarActivoOT(dto);
  }

  @Get(':id/historial')
  @Roles('ADMIN', 'AUDITOR', 'SUPERVISOR')
  async obtenerHistorial(@Param('id') id: string) {
    return await activosRepo.obtenerHistorialActivo(parseInt(id));
  }

  @Delete(':id')
  @Roles('ADMIN', 'SUPERVISOR')
  async eliminarActivo(@Param('id') id: string) {
    return await activosRepo.eliminarActivo(parseInt(id));
  }
}
