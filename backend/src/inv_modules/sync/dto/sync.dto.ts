import { IsArray, IsString, IsNumber, IsOptional, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SyncQueueItemDto {
  @ApiProperty({ description: 'ID único del item en cola local' })
  @IsString()
  localId: string;

  @ApiProperty({ description: 'Entidad afectada', example: 'inventario' })
  @IsString()
  entity: string;

  @ApiProperty({ description: 'Acción a realizar', example: 'adjust_stock' })
  @IsString()
  action: string;

  @ApiProperty({ description: 'Payload con los datos' })
  payload: Record<string, any>;

  @ApiProperty({ description: 'Fecha de creación en cliente' })
  @IsDateString()
  createdAt: string;
}

export class SyncPushRequestDto {
  @ApiProperty({ description: 'ID del dispositivo' })
  @IsString()
  deviceId: string;

  @ApiProperty({ description: 'ID del usuario' })
  @IsNumber()
  userId: number;

  @ApiProperty({ description: 'Items a sincronizar' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncQueueItemDto)
  items: SyncQueueItemDto[];

  @ApiProperty({ description: 'Última fecha de sync', required: false })
  @IsOptional()
  @IsDateString()
  lastSyncAt?: string;
}

export class SyncPullRequestDto {
  @ApiProperty({ description: 'ID del dispositivo' })
  @IsString()
  deviceId: string;

  @ApiProperty({ description: 'ID del usuario' })
  @IsNumber()
  userId: number;

  @ApiProperty({ description: 'Última fecha de sync' })
  @IsDateString()
  lastSyncAt: string;

  @ApiProperty({ description: 'Entidades a sincronizar', example: ['inventario', 'activos'] })
  @IsArray()
  @IsString({ each: true })
  entities: string[];
}

export class SyncResultItemDto {
  @ApiProperty()
  localId: string;

  @ApiProperty()
  serverId: number;

  @ApiProperty({ enum: ['success', 'error', 'conflict'] })
  status: 'success' | 'error' | 'conflict';

  @ApiProperty({ required: false })
  error?: string;
}

export class SyncPushResponseDto {
  @ApiProperty()
  processedAt: string;

  @ApiProperty()
  results: SyncResultItemDto[];

  @ApiProperty()
  successCount: number;

  @ApiProperty()
  errorCount: number;
}

export class SyncPullResponseDto {
  @ApiProperty()
  syncedAt: string;

  @ApiProperty()
  data: {
    inventario?: any[];
    activos?: any[];
    operaciones?: any[];
    transferencias?: any[];
    usuarios?: any[];
    catalogos?: any[];
  };

  @ApiProperty()
  hasMore: boolean;
}
