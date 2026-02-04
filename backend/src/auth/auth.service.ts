import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as authRepo from './auth.repo';
import {
  AuditService,
  AccionAudit,
  RecursoAudit,
} from '../common/audit.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private jwtService: JwtService,
    private auditService: AuditService,
  ) { }

  async validateUser(identifier: string, pass: string): Promise<any> {
    // Sanitize log: avoid logging identifier blindly if it is considered sensitive
    this.logger.debug('Iniciando validación de credenciales');

    // Usar repo SQL Server
    const user = await authRepo.obtenerUsuarioPorIdentificador(identifier);
    if (!user) return null;

    const creds = await authRepo.obtenerCredenciales(user.idUsuario);

    if (creds) {
      const match = await bcrypt.compare(pass, creds.passwordHash);
      if (match) {
        // Actualizar último login de forma asíncrona (no bloqueante)
        authRepo
          .actualizarUltimoLogin(user.idUsuario)
          .catch((e) => this.logger.warn(`Error updating last login for user ${user.idUsuario}`, e));
        return user;
      }
    }

    return null;
  }

  async login(user: any, ipAddress: string) {
    // Registrar Auditoría
    await this.auditService.log({
      idUsuario: user.idUsuario,
      accion: AccionAudit.USUARIO_LOGIN,
      recurso: RecursoAudit.USUARIO,
      recursoId: user.idUsuario.toString(),
      detalles: { correo: user.correo, ip: ipAddress || 'UNKNOWN' },
    });

    // Generar tokens
    const tokens = await this.generateTokens(user);

    // Guardar refresh token
    await this.updateRefreshToken(user.idUsuario, tokens.refresh_token);

    let idOrg: number | undefined;
    // Parse idOrg si es data válida de RRHH
    if (user.idOrg && /^\d+$/.test(user.idOrg.toString())) {
      idOrg = parseInt(user.idOrg.toString(), 10);
    }

    // Calcular subordinados (para determinar si es líder)
    const subordinateCount = user.carnet
      ? await authRepo.contarSubordinados(user.carnet)
      : 0;

    // Resolver menú
    const menuConfig = await this.resolveMenu(user, subordinateCount);

    return {
      ...tokens,
      user: {
        idUsuario: user.idUsuario,
        nombre: user.nombre,
        correo: user.correo,
        carnet: user.carnet,
        rol: user.rol, // Objeto Rol completo
        rolGlobal: user.rolGlobal,
        rolNombre: user.rolGlobal, // Added for frontend compatibility
        pais: user.pais,
        idOrg: idOrg,
        cargo: user.cargo,
        departamento: user.departamento,
        subordinateCount,
        menuConfig,
      },
    };
  }

  async refreshTokens(userId: number, refreshToken: string) {
    const creds = await authRepo.obtenerCredenciales(userId);
    if (!creds || !creds.refreshTokenHash)
      throw new UnauthorizedException('Access Denied');

    const isMatch = await bcrypt.compare(refreshToken, creds.refreshTokenHash);
    if (!isMatch) throw new UnauthorizedException('Access Denied');

    const user = await authRepo.obtenerUsuarioPorId(userId);
    if (!user) throw new UnauthorizedException('User no longer exists');

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.idUsuario, tokens.refresh_token);

    return tokens;
  }

  private async generateTokens(user: any) {
    const payload = {
      correo: user.correo,
      sub: user.idUsuario,
      userId: user.idUsuario,
      roleId: user.idRol,
      carnet: user.carnet,
      rol: user.rolGlobal,
      pais: user.pais,
    };

    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: '12h' }),
      this.jwtService.signAsync(payload, { expiresIn: '7d' }),
    ]);

    return {
      access_token: at,
      refresh_token: rt,
    };
  }

  private async updateRefreshToken(userId: number, rt: string) {
    const hashedRt = await bcrypt.hash(rt, 10);
    await authRepo.actualizarRefreshToken(userId, hashedRt);
  }

  private async resolveMenu(user: any, subordinateCount: number): Promise<any> {
    // 0. Safety override: Admins always get full menu (fallback to frontend constant)
    const roleName = (user.rol?.nombre || user.rolGlobal || '').toUpperCase();
    const isAdmin = roleName === 'ADMIN' || roleName === 'ADMINISTRADOR';

    if (isAdmin) return null; // Frontend usará menú completo

    // 1. Try Custom Menu (Manual Override - Máxima Prioridad)
    try {
      const config = await authRepo.obtenerConfigUsuario(user.idUsuario);
      if (config && config.customMenu) {
        return JSON.parse(config.customMenu);
      }
    } catch (e) {
      this.logger.error('Error parsing custom menu', e);
    }

    // 2. Detección Automática: Si tiene gente a cargo, es Líder
    if (subordinateCount > 0) {
      return { profileType: 'LEADER', subordinateCount };
    }

    // 3. Try Default Role Menu
    if (user.rol && user.rol.defaultMenu) {
      try {
        return JSON.parse(user.rol.defaultMenu);
      } catch (e) {
        this.logger.error('Error parsing role menu', e);
      }
    }

    // 4. Fallback: Empleado Base
    return { profileType: 'EMPLOYEE' };
  }
}
