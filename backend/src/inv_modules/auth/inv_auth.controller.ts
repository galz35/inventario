import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Get,
  Query,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as authRepo from './inv_auth.repo';

@Controller('inv/auth')
export class InvAuthController {
  constructor(private jwtService: JwtService) {}

  @Post('login')
  async login(@Body() body: { correo: string; password: string }) {
    const usuario = await authRepo.login(body.correo, body.password);
    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Estructura de payload compatible con JwtStrategy
    const payload = {
      sub: usuario.idUsuario,
      userId: usuario.idUsuario,
      roleId: usuario.idRol,
      carnet: usuario.carnet,
      correo: usuario.correo,
      rol: usuario.rol?.nombre || 'USER',
    };

    const token = await this.jwtService.signAsync(payload);

    return {
      msg: 'Login exitoso',
      user: usuario,
      token: token,
    };
  }

  @Post('refresh')
  async refresh(@Body() body: { token: string }) {
    // Mock refres para el demo
    const idUsuario = await authRepo.validarRefreshToken(body.token);
    if (!idUsuario) {
      throw new UnauthorizedException('Token inválido o expirado');
    }
    return {
      newToken: 'mock-new-jwt-token-' + idUsuario,
    };
  }

  @Get('permisos')
  async verificarPermisos(
    @Query('idUsuario') idUsuario: string,
    @Query('modulo') modulo: string,
    @Query('accion') accion: string,
  ) {
    const tienePermiso = await authRepo.verificarPermiso(
      parseInt(idUsuario),
      modulo,
      accion,
    );
    return { tienePermiso };
  }
}
