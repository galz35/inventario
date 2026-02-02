import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import * as catRepo from './catalogos.repo';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';

@Controller('inv/catalogos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'AUDITOR', 'SUPERVISOR', 'TECNICO', 'DESPACHO', 'BODEGA')
export class CatalogosController {
  @Get('categorias')
  async getCategorias() {
    return await catRepo.listarCategorias();
  }

  @Post('categorias')
  @Roles('ADMIN')
  async upsertCategoria(@Body() dto: any) {
    return await catRepo.upsertCategoria(dto);
  }

  @Get('proveedores')
  async getProveedores() {
    return await catRepo.listarProveedores();
  }

  @Post('proveedores')
  @Roles('ADMIN')
  async upsertProveedor(@Body() dto: any) {
    return await catRepo.upsertProveedor(dto);
  }

  @Get('productos')
  async getProductos() {
    return await catRepo.listarProductos();
  }

  @Post('productos')
  @Roles('ADMIN')
  async upsertProducto(@Body() dto: any) {
    return await catRepo.upsertProducto(dto);
  }

  @Get('almacenes')
  async getAlmacenes() {
    return await catRepo.listarAlmacenes();
  }

  @Post('almacenes')
  @Roles('ADMIN')
  async upsertAlmacen(@Body() dto: any) {
    return await catRepo.upsertAlmacen(dto);
  }

  @Get('clientes')
  async getClientes() {
    return await catRepo.listarClientes();
  }

  @Get('tipos-ot')
  async getTiposOT() {
    return await catRepo.listarTiposOT();
  }

  @Get('usuarios')
  async getUsuarios() {
    return await catRepo.listarUsuarios();
  }
}
