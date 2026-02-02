import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Get,
  Query,
  Patch,
  Param,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as authRepo from './inv_auth.repo';

import * as bcrypt from 'bcrypt';
import * as globalAuthRepo from '../../auth/auth.repo';

@Controller('inv/auth')
export class InvAuthController {
  constructor(private jwtService: JwtService) { }

  @Post('login')
  async login(@Body() body: { correo: string; password: string }) {
    // 1. Validar usuario existente y activo
    const user = await globalAuthRepo.obtenerUsuarioPorIdentificador(body.correo);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 2. Obtener credenciales (hash)
    const creds = await globalAuthRepo.obtenerCredenciales(user.idUsuario);
    if (!creds || !creds.passwordHash) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 3. Comparar contraseña (Input vs Hash)
    const isMatch = await bcrypt.compare(body.password, creds.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 4. Invocar SP de Login (Pasando el HASH almacenado, no el texto plano)
    // El SP hace: WHERE password = @password. Al pasar el mismo hash que está en BD, coincide.
    const usuario = await authRepo.login(body.correo, creds.passwordHash);

    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas o usuario inactivo');
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

  // === GESTIÓN DE USUARIOS ===

  @Get('usuarios')
  async listarUsuarios() {
    const usuarios = await authRepo.listarUsuarios();
    return { data: usuarios };
  }

  @Patch('usuarios/:id/estado')
  async toggleEstado(@Param('id') id: string, @Body() body: { activo: boolean }) {
    await authRepo.toggleEstadoUsuario(parseInt(id), body.activo);
    return { msg: 'Estado actualizado' };
  }

  @Post('usuarios')
  async crearUsuario(@Body() body: any) {
    // 1. Hash Password
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(body.password, salt);

    // 2. Save
    try {
      await authRepo.crearUsuario({ ...body, password: hash });
      return { msg: 'Usuario creado correctamente' };
    } catch (e) {
      throw new UnauthorizedException('Error al crear usuario. Verifique si el correo o carnet ya existen.');
    }
  }
}
