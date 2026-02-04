import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  Logger,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { JwtService } from '@nestjs/jwt';
import { InvalidCredentialsException } from '../common/exceptions';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
  ) { }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, description: 'Login exitoso, retorna tokens.' })
  async login(@Body() loginDto: LoginDto, @Req() req: any) {
    try {
      const user = await this.authService.validateUser(
        loginDto.correo,
        loginDto.password,
      );
      if (!user) {
        throw new InvalidCredentialsException();
      }
      const ip = req.ip || req.connection?.remoteAddress || 'UNKNOWN';
      return await this.authService.login(user, ip);
    } catch (e: any) {
      if (e instanceof InvalidCredentialsException) throw e;

      this.logger.error(`Login Error for user ${loginDto.correo}: ${e.message}`, e.stack);

      // Security: Do not expose stack trace to client
      throw new InternalServerErrorException('Login process failed. Please contact support.');
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @ApiOperation({ summary: 'Refrescar token de acceso' })
  async refresh(@Body() dto: RefreshTokenDto) {
    try {
      // Improve: verifyAsync will throw if token is invalid/expired
      const payload = await this.jwtService.verifyAsync(dto.refreshToken);
      return await this.authService.refreshTokens(payload.sub, dto.refreshToken);
    } catch (e: any) {
      this.logger.warn(`Refresh Token Failed: ${e.message}`);
      throw new UnauthorizedException('Invalid or Expired Refresh Token');
    }
  }
}
