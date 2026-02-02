import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import * as invRepo from './inventario.repo';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { ExcelService } from '../../common/services/excel.service';

@Controller('inv/inventario')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventarioController {
  constructor(private excelService: ExcelService) { }

  @Get('stock')
  async getStock(
    @Query('almacenId') almacenId?: string,
    @Query('buscar') buscar?: string,
  ) {
    return await invRepo.obtenerStock({
      almacenId: almacenId ? parseInt(almacenId) : undefined,
      buscar,
    });
  }

  @Get('stock/consignacion')
  async getStockConsignacion() {
    return await invRepo.obtenerStockConsignado();
  }

  @Get('transferencias')
  async getTransferencias(
    @Query('almacenId') almacenId?: string,
    @Query('estado') estado?: string,
  ) {
    return await invRepo.obtenerTransferencias({
      idAlmacen: almacenId ? parseInt(almacenId) : undefined,
      estado,
    });
  }

  @Get('transferencias/:id/detalles')
  async getTransferenciaDetalles(@Param('id') id: string) {
    return await invRepo.obtenerTransferenciaDetalles(parseInt(id));
  }

  @Post('movimiento')
  async registrarMovimiento(@Body() dto: any, @Request() req: any) {
    return await invRepo.registrarMovimiento({
      ...dto,
      idUsuarioResponsable: req.user.userId,
    });
  }

  @Get('kardex')
  async getKardex(
    @Query('almacenId') almacenId: string,
    @Query('productoId') productoId: string,
  ) {
    return await invRepo.obtenerKardex({
      almacenId: parseInt(almacenId),
      productoId: parseInt(productoId),
    });
  }

  @Post('transferencia/enviar')
  async enviarTransferencia(@Body() dto: any, @Request() req: any) {
    return await invRepo.enviarTransferencia({
      ...dto,
      idUsuarioEnvia: req.user.userId,
    });
  }

  @Post('transferencia/confirmar')
  @Roles('ADMIN', 'SUPERVISOR', 'TECNICO')
  async confirmarTransferencia(
    @Body() dto: { idTransferencia: number },
    @Request() req: any,
  ) {
    return await invRepo.confirmarTransferencia(
      dto.idTransferencia,
      req.user.userId,
    );
  }

  @Post('importar')
  @Roles('ADMIN', 'SUPERVISOR')
  async importar(
    @Body() body: { base64: string; almacenId: number },
    @Request() req: any,
  ) {
    const rawData = await this.excelService.parseExcel(body.base64);
    const mappedItems = this.excelService.mapStockImport(rawData);

    return await invRepo.importarStockPorExcel({
      almacenId: body.almacenId,
      idUsuario: req.user.userId,
      items: mappedItems,
    });
  }

  @Post('entrada-proveedor')
  @Roles('ADMIN', 'SUPERVISOR')
  async entradaProveedor(@Body() dto: any, @Request() req: any) {
    return await invRepo.registrarEntradaProveedor({
      ...dto,
      idUsuario: req.user.userId,
    });
  }
}
