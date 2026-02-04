import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import * as opeRepo from './operaciones.repo';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import * as fs from 'fs';
import * as path from 'path';

@Controller('inv/operaciones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OperacionesController {
  @Get('ot')
  async listarOTs(@Request() req: any, @Query('estado') estado?: string, @Query('idCliente') idCliente?: string) {
    // If technical role, filter by self
    const isTecnico = req.user.role === 'TECNICO';
    return await opeRepo.listarOTsQuery(
      isTecnico ? req.user.userId : undefined,
      idCliente ? parseInt(idCliente) : undefined
    );
  }

  @Post('ot')
  @Roles('ADMIN', 'SUPERVISOR', 'DESPACHO')
  async crearOT(@Body() dto: any, @Request() req: any) {
    return await opeRepo.crearOT({
      ...dto,
      idUsuarioCrea: req.user.userId,
    });
  }

  @Post('ot/:id/cerrar')
  @Roles('TECNICO', 'SUPERVISOR')
  async cerrarOT(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { notas: string },
  ) {
    return await opeRepo.cerrarOT(parseInt(id), req.user.userId, body.notas);
  }

  @Post('ot/:id/consumo')
  async registrarConsumo(
    @Param('id') id: string,
    @Body() dto: any,
    @Request() req: any,
  ) {
    return await opeRepo.registrarConsumoOT(parseInt(id), {
      ...dto,
      idUsuario: req.user.userId,
    });
  }

  @Post('ot/:id/evidencia')
  async subirEvidencia(
    @Param('id') id: string,
    @Body() body: { base64: string; tipo: string },
  ) {
    const uploadDir = path.resolve('uploads', 'ot_evidencias');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Detect format from base64 header or default to jpg (or webp if user converts it)
    let ext = 'jpg';
    if (body.base64.startsWith('data:image/webp')) ext = 'webp';
    else if (body.base64.startsWith('data:image/png')) ext = 'png';
    else if (body.base64.startsWith('data:application/pdf')) ext = 'pdf';

    const fileName = `OT_${id}_${Date.now()}.${ext}`;
    const filePath = path.join(uploadDir, fileName);

    // Remove header
    const base64Data = body.base64.replace(/^data:\w+\/\w+;base64,/, '');

    fs.writeFileSync(filePath, base64Data, 'base64');

    return {
      message: 'Evidencia guardada',
      url: `/uploads/ot_evidencias/${fileName}`,
      nombre: fileName
    };
  }

  @Get('ot/:id/evidencias')
  async listarEvidencias(@Param('id') id: string) {
    const uploadDir = path.resolve('uploads', 'ot_evidencias');
    if (!fs.existsSync(uploadDir)) return [];

    const files = fs.readdirSync(uploadDir);
    // Filter files starting with OT_{id}_
    const otFiles = files.filter(f => f.startsWith(`OT_${id}_`));

    return otFiles.map(f => ({
      nombre: f,
      url: `/uploads/ot_evidencias/${f}`,
      fecha: fs.statSync(path.join(uploadDir, f)).mtime
    }));
  }



  @Post('ot/:id/asignar')
  @Roles('ADMIN', 'SUPERVISOR', 'DESPACHO')
  async asignarOT(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { idTecnico: number },
  ) {
    await opeRepo.asignarOT(parseInt(id), body.idTecnico, req.user.userId);
    return { msg: 'Técnico asignado correctamente' };
  }

  @Post('ot/:id/actualizar')
  @Roles('ADMIN', 'SUPERVISOR', 'DESPACHO')
  async actualizarOT(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: any,
  ) {
    await opeRepo.actualizarOT(parseInt(id), dto, req.user.userId);
    return { msg: 'Orden actualizada correctamente' };
  }

  @Get('ot/:id/historial')
  async getHistorialOT(@Param('id') id: string) {
    return await opeRepo.getHistorialOT(parseInt(id));
  }
}

