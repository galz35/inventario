import { Injectable, Logger } from '@nestjs/common';
import * as accesoRepo from './acceso.repo';

/**
 * VisibilidadService - Servicio maestro para calcular visibilidad de empleados
 * SQL Server Directo via acceso.repo
 */
@Injectable()
export class VisibilidadService {
  private readonly logger = new Logger(VisibilidadService.name);

  // ===========================
  // Cache simple (memoria)
  // ===========================
  private readonly TTL_MS = 60_000; // 60s
  private readonly MAX_CACHE = 2000;
  private readonly carnetsCache = new Map<
    string,
    { exp: number; value: string[] }
  >();

  private limpiarCacheSiCrece() {
    if (this.carnetsCache.size <= this.MAX_CACHE) return;
    const ahora = Date.now();
    for (const [k, v] of this.carnetsCache.entries()) {
      if (v.exp <= ahora) this.carnetsCache.delete(k);
    }
    if (this.carnetsCache.size <= this.MAX_CACHE) return;

    const overflow = this.carnetsCache.size - this.MAX_CACHE;
    let i = 0;
    for (const k of this.carnetsCache.keys()) {
      this.carnetsCache.delete(k);
      i++;
      if (i >= overflow) break;
    }
  }

  private getCache(key: string): string[] | null {
    const item = this.carnetsCache.get(key);
    if (!item) return null;
    if (item.exp <= Date.now()) {
      this.carnetsCache.delete(key);
      return null;
    }
    return item.value;
  }

  private setCache(key: string, value: string[]) {
    this.carnetsCache.set(key, { exp: Date.now() + this.TTL_MS, value });
    this.limpiarCacheSiCrece();
  }

  /**
   * Asegura que el carnet sea string y sin espacios.
   */
  private limpiarCarnet(c: string | null | undefined): string {
    return (c ?? '').trim();
  }

  private chunk<T>(arr: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }

  /**
   * Valida mes (1-12) y año (2000-2100).
   * Lanza BadRequestException si falla.
   */
  ensureMonthYear(mes: number, anio: number) {
    if (!mes || Number.isNaN(mes) || mes < 1 || mes > 12) {
      const { BadRequestException } = require('@nestjs/common');
      throw new BadRequestException('mes inválido (1-12).');
    }
    if (!anio || Number.isNaN(anio) || anio < 2000 || anio > 2100) {
      const { BadRequestException } = require('@nestjs/common');
      throw new BadRequestException('anio inválido (2000-2100).');
    }
  }

  // ===========================
  // API pública
  // ===========================

  /**
   * Obtiene todos los carnets que un usuario puede ver.
   */
  async obtenerCarnetsVisibles(carnetSolicitante: string): Promise<string[]> {
    const cleanCarnet = this.limpiarCarnet(carnetSolicitante);
    if (!cleanCarnet) return [];

    const cached = this.getCache(cleanCarnet);
    if (cached) return cached;

    try {
      const carnets = await accesoRepo.calcularCarnetsVisibles(cleanCarnet);

      const finalList =
        carnets && carnets.length > 0
          ? Array.from(
              new Set(
                carnets.map((c) => this.limpiarCarnet(c)).filter(Boolean),
              ),
            )
          : [cleanCarnet];

      this.setCache(cleanCarnet, finalList);
      return finalList;
    } catch (error: any) {
      this.logger.warn(
        `Error calculando visibilidad para ${cleanCarnet} | ${error?.message || error}`,
      );
      const self = [cleanCarnet];
      this.setCache(cleanCarnet, self);
      return self;
    }
  }

  /**
   * Verifica si el solicitante puede ver al objetivo.
   */
  async puedeVer(
    carnetSolicitante: string,
    carnetObjetivo: string,
  ): Promise<boolean> {
    const a = this.limpiarCarnet(carnetSolicitante);
    const b = this.limpiarCarnet(carnetObjetivo);
    if (!a || !b) return false;
    if (a === b) return true;

    const visibles = await this.obtenerCarnetsVisibles(a);
    return visibles.includes(b);
  }

  /**
   * Devuelve detalles de usuarios visibles.
   */
  async obtenerEmpleadosVisibles(carnetSolicitante: string): Promise<any[]> {
    const carnets = await this.obtenerCarnetsVisibles(carnetSolicitante);
    if (carnets.length === 0) return [];

    try {
      const CHUNK_SIZE = 300;
      const chunks = this.chunk(carnets, CHUNK_SIZE);
      const results: any[] = [];

      for (const part of chunks) {
        const rows = await accesoRepo.obtenerDetallesUsuarios(part);
        if (rows && rows.length) results.push(...rows);
      }

      return results;
    } catch (error: any) {
      this.logger.error(
        `Error fetching visible employees | ${error?.message || error}`,
      );
      return [];
    }
  }

  /**
   * Resuelve carnet de un idUsuario.
   */
  async obtenerCarnetPorId(idUsuario: number): Promise<string | null> {
    try {
      return await accesoRepo.obtenerCarnetDeUsuario(idUsuario);
    } catch (error: any) {
      this.logger.error(
        `Error resolving carnet for ID ${idUsuario}: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Verifica acceso usando IDs numéricos.
   */
  async verificarAccesoPorId(
    idSolicitante: number,
    idObjetivo: number,
  ): Promise<boolean> {
    if (!idSolicitante || !idObjetivo) return false;
    if (idSolicitante === idObjetivo) return true;

    try {
      const [carnet1, carnet2] = await Promise.all([
        accesoRepo.obtenerCarnetDeUsuario(idSolicitante),
        accesoRepo.obtenerCarnetDeUsuario(idObjetivo),
      ]);

      const a = this.limpiarCarnet(carnet1);
      const b = this.limpiarCarnet(carnet2);

      if (!a || !b) return false;

      return await this.puedeVer(a, b);
    } catch (error: any) {
      this.logger.error(
        `Error verifying access by ID | ${error?.message || error}`,
      );
      return false;
    }
  }

  /**
   * Actores efectivos: Solicitante + delegantes activos.
   */
  async obtenerActoresEfectivos(carnetSolicitante: string): Promise<string[]> {
    const c = this.limpiarCarnet(carnetSolicitante);
    if (!c) return [];

    try {
      const delegaciones = await accesoRepo.obtenerDelegacionesActivas(c);
      const delegantes = (delegaciones || [])
        .map((d: any) => this.limpiarCarnet(d.carnet_delegante))
        .filter(Boolean);

      return Array.from(new Set([c, ...delegantes]));
    } catch (error: any) {
      this.logger.warn(
        `Error obteniendo actores efectivos | ${error?.message || error}`,
      );
      return [c];
    }
  }

  async obtenerQuienPuedeVer(carnetObjetivo: string): Promise<any[]> {
    return [];
  }

  /**
   * NUEVO: Obtener Mi Equipo (Jerarquía + Permisos)
   * Llama al SP carnet-first optimizado
   */
  async obtenerMiEquipo(carnetSolicitante: string): Promise<any[]> {
    const c = this.limpiarCarnet(carnetSolicitante);
    if (!c) return [];

    try {
      const rows = await accesoRepo.obtenerMiEquipoPorCarnet(c);
      return rows || [];
    } catch (error: any) {
      this.logger.error(
        `Error fetching team for ${c} | ${error?.message || error}`,
      );
      return [];
    }
  }

  clearCache() {
    this.carnetsCache.clear();
  }
}
