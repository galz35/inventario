import {
    Controller,
    Get,
    Post,
    Body,
    UseGuards,
    Request,
    Query,
} from '@nestjs/common';
import * as vehRepo from './vehiculos.repo';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';

@Controller('inv/vehiculos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VehiculosController {

    @Get()
    async getVehiculos() {
        return await vehRepo.listarVehiculos();
    }

    @Post()
    @Roles('ADMIN', 'SUPERVISOR')
    async upsertVehiculo(@Body() dto: any) {
        return await vehRepo.upsertVehiculo(dto);
    }

    @Get('logs')
    async getLogs(@Query('idVehiculo') idVehiculo?: string) {
        return await vehRepo.obtenerUltimosLogs(idVehiculo ? parseInt(idVehiculo) : undefined);
    }

    @Post('log')
    async registrarLog(@Body() dto: any, @Request() req: any) {
        return await vehRepo.registrarLogVehiculo({
            ...dto,
            idUsuario: req.user.userId
        });
    }
}
