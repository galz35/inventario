import { Injectable, Logger } from '@nestjs/common';
import { DbService } from '../../db/db.module';
import {
  SyncPushRequestDto,
  SyncPushResponseDto,
  SyncPullRequestDto,
  SyncPullResponseDto,
  SyncResultItemDto,
} from './dto/sync.dto';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(private readonly db: DbService) {}

  async processPush(dto: SyncPushRequestDto): Promise<SyncPushResponseDto> {
    const results: SyncResultItemDto[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (const item of dto.items) {
      try {
        const serverId = await this.processItem(item, dto.userId);
        results.push({
          localId: item.localId,
          serverId,
          status: 'success',
        });
        successCount++;
      } catch (error) {
        this.logger.error(`Error procesando item ${item.localId}:`, error);
        results.push({
          localId: item.localId,
          serverId: 0,
          status: 'error',
          error: error.message,
        });
        errorCount++;
      }
    }

    // Registrar sync en historial
    await this.logSync(dto.deviceId, dto.userId, 'push', successCount, errorCount);

    return {
      processedAt: new Date().toISOString(),
      results,
      successCount,
      errorCount,
    };
  }

  private async processItem(item: any, userId: number): Promise<number> {
    const { entity, action, payload } = item;

    switch (entity) {
      case 'inventario':
        return this.processInventarioAction(action, payload, userId);
      case 'activos':
        return this.processActivosAction(action, payload, userId);
      case 'operaciones':
        return this.processOperacionesAction(action, payload, userId);
      case 'transferencias':
        return this.processTransferenciasAction(action, payload, userId);
      default:
        throw new Error(`Entidad desconocida: ${entity}`);
    }
  }

  private async processInventarioAction(action: string, payload: any, userId: number): Promise<number> {
    const pool = await this.db.getPool();
    
    switch (action) {
      case 'adjust_stock': {
        const result = await pool.request()
          .input('id', payload.id)
          .input('delta', payload.delta)
          .input('motivo', payload.motivo)
          .input('userId', userId)
          .query(`
            UPDATE inv_Materiales 
            SET stock = stock + @delta, 
                updated_at = GETDATE(),
                updated_by = @userId
            WHERE id = @id;
            
            INSERT INTO inv_Movimientos (material_id, tipo, cantidad, motivo, created_by, created_at)
            VALUES (@id, CASE WHEN @delta > 0 THEN 'ENTRADA' ELSE 'SALIDA' END, ABS(@delta), @motivo, @userId, GETDATE());
            
            SELECT @id as id;
          `);
        return payload.id;
      }
      default:
        throw new Error(`Acción de inventario desconocida: ${action}`);
    }
  }

  private async processActivosAction(action: string, payload: any, userId: number): Promise<number> {
    const pool = await this.db.getPool();
    
    switch (action) {
      case 'create': {
        const result = await pool.request()
          .input('codigo', payload.codigo)
          .input('nombre', payload.nombre)
          .input('ubicacion', payload.ubicacion)
          .input('estado', payload.estado || 'Disponible')
          .input('userId', userId)
          .query(`
            INSERT INTO inv_Activos (codigo, nombre, ubicacion, estado, created_by, created_at)
            OUTPUT INSERTED.id
            VALUES (@codigo, @nombre, @ubicacion, @estado, @userId, GETDATE());
          `);
        return result.recordset[0].id;
      }
      case 'update_estado': {
        await pool.request()
          .input('id', payload.id)
          .input('estado', payload.estado)
          .input('userId', userId)
          .query(`
            UPDATE inv_Activos 
            SET estado = @estado, updated_at = GETDATE(), updated_by = @userId
            WHERE id = @id;
          `);
        return payload.id;
      }
      default:
        throw new Error(`Acción de activos desconocida: ${action}`);
    }
  }

  private async processOperacionesAction(action: string, payload: any, userId: number): Promise<number> {
    const pool = await this.db.getPool();
    
    switch (action) {
      case 'create': {
        const result = await pool.request()
          .input('codigoOt', payload.codigoOt)
          .input('tecnico', payload.tecnico)
          .input('materialesUsados', payload.materialesUsados)
          .input('estado', payload.estado || 'Pendiente')
          .input('userId', userId)
          .query(`
            INSERT INTO inv_OrdenesT (codigo_ot, tecnico, materiales_usados, estado, created_by, created_at)
            OUTPUT INSERTED.id
            VALUES (@codigoOt, @tecnico, @materialesUsados, @estado, @userId, GETDATE());
          `);
        return result.recordset[0].id;
      }
      case 'update_estado': {
        await pool.request()
          .input('id', payload.id)
          .input('estado', payload.estado)
          .input('userId', userId)
          .query(`
            UPDATE inv_OrdenesT 
            SET estado = @estado, updated_at = GETDATE(), updated_by = @userId
            WHERE id = @id;
          `);
        return payload.id;
      }
      default:
        throw new Error(`Acción de operaciones desconocida: ${action}`);
    }
  }

  private async processTransferenciasAction(action: string, payload: any, userId: number): Promise<number> {
    const pool = await this.db.getPool();
    
    switch (action) {
      case 'create': {
        const result = await pool.request()
          .input('origen', payload.origen)
          .input('destino', payload.destino)
          .input('estado', 'Pendiente')
          .input('userId', userId)
          .query(`
            INSERT INTO inv_Transferencias (origen, destino, estado, total_items, created_by, created_at)
            OUTPUT INSERTED.id
            VALUES (@origen, @destino, @estado, 0, @userId, GETDATE());
          `);
        return result.recordset[0].id;
      }
      case 'add_linea': {
        const result = await pool.request()
          .input('transferenciaId', payload.transferenciaId)
          .input('codigo', payload.codigo)
          .input('descripcion', payload.descripcion)
          .input('cantidad', payload.cantidad)
          .query(`
            INSERT INTO inv_TransferenciaLineas (transferencia_id, codigo, descripcion, cantidad, recibido)
            OUTPUT INSERTED.id
            VALUES (@transferenciaId, @codigo, @descripcion, @cantidad, 0);
            
            UPDATE inv_Transferencias SET total_items = total_items + 1 WHERE id = @transferenciaId;
          `);
        return result.recordset[0].id;
      }
      case 'update_recepcion': {
        await pool.request()
          .input('lineaId', payload.lineaId)
          .input('recibido', payload.recibido)
          .query(`
            UPDATE inv_TransferenciaLineas SET recibido = @recibido WHERE id = @lineaId;
          `);
        return payload.lineaId;
      }
      case 'update_estado': {
        await pool.request()
          .input('id', payload.id)
          .input('estado', payload.estado)
          .input('userId', userId)
          .query(`
            UPDATE inv_Transferencias 
            SET estado = @estado, updated_at = GETDATE(), updated_by = @userId
            WHERE id = @id;
          `);
        return payload.id;
      }
      default:
        throw new Error(`Acción de transferencias desconocida: ${action}`);
    }
  }

  async processPull(dto: SyncPullRequestDto): Promise<SyncPullResponseDto> {
    const pool = await this.db.getPool();
    const data: any = {};
    const lastSync = new Date(dto.lastSyncAt);

    for (const entity of dto.entities) {
      switch (entity) {
        case 'inventario':
          const invResult = await pool.request()
            .input('lastSync', lastSync)
            .query(`
              SELECT id, codigo, descripcion, stock, updated_at
              FROM inv_Materiales 
              WHERE updated_at > @lastSync OR created_at > @lastSync
              ORDER BY updated_at DESC
            `);
          data.inventario = invResult.recordset;
          break;

        case 'activos':
          const actResult = await pool.request()
            .input('lastSync', lastSync)
            .query(`
              SELECT id, codigo, nombre, ubicacion, estado, updated_at
              FROM inv_Activos 
              WHERE updated_at > @lastSync OR created_at > @lastSync
              ORDER BY updated_at DESC
            `);
          data.activos = actResult.recordset;
          break;

        case 'operaciones':
          const opResult = await pool.request()
            .input('lastSync', lastSync)
            .query(`
              SELECT id, codigo_ot as codigoOt, tecnico, materiales_usados as materialesUsados, estado, updated_at
              FROM inv_OrdenesT 
              WHERE updated_at > @lastSync OR created_at > @lastSync
              ORDER BY updated_at DESC
            `);
          data.operaciones = opResult.recordset;
          break;

        case 'transferencias':
          const transResult = await pool.request()
            .input('lastSync', lastSync)
            .query(`
              SELECT t.id, t.origen, t.destino, t.estado, t.total_items as totalItems, t.updated_at,
                     (SELECT l.id, l.codigo, l.descripcion, l.cantidad, l.recibido
                      FROM inv_TransferenciaLineas l WHERE l.transferencia_id = t.id
                      FOR JSON PATH) as lineas
              FROM inv_Transferencias t
              WHERE t.updated_at > @lastSync OR t.created_at > @lastSync
              ORDER BY t.updated_at DESC
            `);
          data.transferencias = transResult.recordset.map(t => ({
            ...t,
            lineas: t.lineas ? JSON.parse(t.lineas) : []
          }));
          break;

        case 'catalogos':
          const catResult = await pool.request()
            .query(`
              SELECT id, tipo, codigo, descripcion FROM inv_Catalogos ORDER BY tipo, descripcion
            `);
          data.catalogos = catResult.recordset;
          break;
      }
    }

    // Registrar sync
    await this.logSync(dto.deviceId, dto.userId, 'pull', Object.keys(data).length, 0);

    return {
      syncedAt: new Date().toISOString(),
      data,
      hasMore: false,
    };
  }

  async getStatus(deviceId: string, userId: number) {
    const pool = await this.db.getPool();
    const result = await pool.request()
      .input('deviceId', deviceId)
      .input('userId', userId)
      .query(`
        SELECT TOP 1 * FROM inv_SyncLog 
        WHERE device_id = @deviceId AND user_id = @userId
        ORDER BY created_at DESC
      `);
    
    return {
      lastSync: result.recordset[0]?.created_at || null,
      pendingServer: 0, // TODO: contar cambios pendientes
    };
  }

  private async logSync(deviceId: string, userId: number, type: string, success: number, errors: number) {
    const pool = await this.db.getPool();
    await pool.request()
      .input('deviceId', deviceId)
      .input('userId', userId)
      .input('type', type)
      .input('success', success)
      .input('errors', errors)
      .query(`
        INSERT INTO inv_SyncLog (device_id, user_id, sync_type, success_count, error_count, created_at)
        VALUES (@deviceId, @userId, @type, @success, @errors, GETDATE())
      `);
  }
}
