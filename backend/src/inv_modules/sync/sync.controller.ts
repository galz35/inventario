import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { SyncService } from './sync.service';
import {
  SyncPushRequestDto,
  SyncPushResponseDto,
  SyncPullRequestDto,
  SyncPullResponseDto,
} from './dto/sync.dto';

@ApiTags('Sincronización Móvil')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('push')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Enviar cambios desde móvil al servidor',
    description: 'Recibe items de la cola de sync del dispositivo móvil y los procesa'
  })
  @ApiResponse({ status: 200, type: SyncPushResponseDto })
  async push(@Body() dto: SyncPushRequestDto): Promise<SyncPushResponseDto> {
    return this.syncService.processPush(dto);
  }

  @Post('pull')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener cambios del servidor para móvil',
    description: 'Devuelve todos los cambios desde la última sincronización'
  })
  @ApiResponse({ status: 200, type: SyncPullResponseDto })
  async pull(@Body() dto: SyncPullRequestDto): Promise<SyncPullResponseDto> {
    return this.syncService.processPull(dto);
  }

  @Post('status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar estado de sincronización' })
  async status(@Body() body: { deviceId: string; userId: number }) {
    return this.syncService.getStatus(body.deviceId, body.userId);
  }
}
