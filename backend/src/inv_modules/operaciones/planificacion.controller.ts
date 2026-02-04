import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import * as planRepo from './planificacion.repo';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';

@Controller('inv/planificacion')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlanificacionController {
  @Get('proyectos')
  async getProyectos() {
    return await planRepo.listarProyectos();
  }

  @Post('tarea')
  @Roles('ADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'DESPACHO', 'ALMACEN')
  async crearTarea(@Body() dto: planRepo.ProyectoTarea) {
    return await planRepo.crearTarea(dto);
  }

  @Post('tarea/:id')
  @Roles('ADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'DESPACHO', 'ALMACEN')
  async actualizarTarea(@Param('id') id: string, @Body() dto: any) {
    return await planRepo.actualizarTarea(parseInt(id), dto);
  }

  @Get('proyectos/:id/wbs')
  @Roles('ADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'AUDITOR', 'TECNICO', 'DESPACHO', 'ALMACEN')
  async getWBS(@Param('id') id: string) {
    return await planRepo.obtenerWBS(parseInt(id));
  }

  @Post('material-estimado')
  @Roles('ADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'TECNICO', 'DESPACHO', 'ALMACEN')
  async estimarMaterial(@Body() dto: planRepo.MaterialEstimado) {
    return await planRepo.estimarMateriales(dto);
  }

  @Get('proyectos/:id/presupuesto-real')
  @Roles('ADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'AUDITOR', 'TECNICO', 'DESPACHO', 'ALMACEN')
  async getPresupuestoVsReal(@Param('id') id: string) {
    return await planRepo.obtenerPresupuestoVsReal(parseInt(id));
  }

  @Get('proyectos/:id/historial')
  @Roles('ADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'AUDITOR', 'TECNICO', 'DESPACHO', 'ALMACEN')
  async getHistorial(@Param('id') id: string) {
    return await planRepo.obtenerHistorialProyecto(parseInt(id));
  }

  @Post('proyectos')
  @Roles('ADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'DESPACHO', 'ALMACEN')
  async crearProyecto(@Body() dto: any) {
    return await planRepo.crearProyecto(dto);
  }

  @Post('proyectos/:id')
  @Roles('ADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'DESPACHO', 'ALMACEN')
  async actualizarProyecto(@Param('id') id: string, @Body() dto: any) {
    return await planRepo.actualizarProyecto(parseInt(id), dto);
  }

  @Delete('proyectos/:id')
  @Roles('ADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'DESPACHO', 'ALMACEN')
  async eliminarProyecto(@Param('id') id: string) {
    return await planRepo.eliminarProyecto(parseInt(id));
  }

  @Post('tarea/:id/asignar')
  @Roles('ADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'TECNICO', 'DESPACHO', 'ALMACEN')
  async asignarUsuario(@Param('id') id: string, @Body() dto: any) {
    return await planRepo.asignarUsuarioPorId({
      ...dto,
      idTarea: parseInt(id),
    });
  }

  @Get('tarea/:id/recursos')
  @Roles('ADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'AUDITOR', 'TECNICO', 'DESPACHO', 'ALMACEN')
  async getRecursosTarea(@Param('id') id: string) {
    return await planRepo.obtenerRecursosTarea(parseInt(id));
  }
}
