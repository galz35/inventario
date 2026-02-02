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
    // Real implementation of file saving
    const uploadDir = path.resolve('uploads', 'ot_evidencias');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `OT_${id}_${Date.now()}.jpg`;
    const filePath = path.join(uploadDir, fileName);

    // Remove header if present (data:image/jpeg;base64,...)
    const base64Data = body.base64.replace(/^data:image\/\w+;base64,/, '');

    fs.writeFileSync(filePath, base64Data, 'base64');

    // Here we should check if we store full path or relative
    // For now, return success
    return {
      message: 'Evidencia guardada',
      url: `/uploads/ot_evidencias/${fileName}`,
    };
  }
}
