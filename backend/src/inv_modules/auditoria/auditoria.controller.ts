import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import {
    listarAuditorias,
    iniciarAuditoria,
    conciliarAuditoria,
    listarCierresMensuales,
    generarCierreMensual
} from './auditoria.repo';

@Controller('inv/auditoria')
@UseGuards(JwtAuthGuard)
export class AuditoriaController {

    @Get('conteos')
    async listar() {
        return await listarAuditorias();
    }

    @Post('iniciar')
    @Roles('ADMIN', 'SUPERVISOR', 'BODEGA')
    async iniciar(@Body() body: any, @Request() req: any) {
        return await iniciarAuditoria({
            ...body,
            idUsuario: req.user.idUsuario
        });
    }

    @Post('conciliar')
    @Roles('ADMIN', 'SUPERVISOR')
    async conciliar(@Body() body: any, @Request() req: any) {
        return await conciliarAuditoria({
            ...body,
            idUsuario: req.user.idUsuario
        });
    }

    @Get('cierres')
    async listarCierres() {
        return await listarCierresMensuales();
    }

    @Post('cierre-mensual')
    @Roles('ADMIN')
    async generarCierre(@Body() body: any, @Request() req: any) {
        return await generarCierreMensual({
            ...body,
            idUsuario: req.user.idUsuario
        });
    }
}
