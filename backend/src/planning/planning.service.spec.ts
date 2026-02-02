import { Test, TestingModule } from '@nestjs/testing';
import { PlanningService } from './planning.service';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import * as planningRepo from './planning.repo';
import * as authRepo from '../auth/auth.repo';
import { AuditService } from '../common/audit.service';
import { VisibilidadService } from '../acceso/visibilidad.service';

// Mock de módulos de repositorio
jest.mock('./planning.repo');
jest.mock('../auth/auth.repo');

describe('PlanningService', () => {
  let service: PlanningService;
  let auditService: AuditService;
  let visibilidadService: VisibilidadService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlanningService,
        { provide: AuditService, useValue: { log: jest.fn() } },
        {
          provide: VisibilidadService,
          useValue: { verificarAccesoPorId: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<PlanningService>(PlanningService);
    auditService = module.get<AuditService>(AuditService);
    visibilidadService = module.get<VisibilidadService>(VisibilidadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ==================== checkEditPermission Tests ====================
  describe('checkEditPermission', () => {
    it('should allow free edit for personal tasks (no project)', async () => {
      const task = { idTarea: 1, nombre: 'Personal Task', idProyecto: null };
      (planningRepo.obtenerTareaPorId as jest.Mock).mockResolvedValue(task);

      const result = await service.checkEditPermission(1, 10);

      expect(result).toEqual({
        puedeEditar: true,
        requiereAprobacion: false,
        tipoProyecto: 'Personal',
      });
    });

    it('should require approval for strategic projects (non-admin)', async () => {
      const task = {
        idTarea: 1,
        nombre: 'Strategic Task',
        idProyecto: 1,
        proyectoTipo: 'Estrategico',
        proyectoRequiereAprobacion: true,
      };
      const user = { idUsuario: 10, rolGlobal: 'User' };

      (planningRepo.obtenerTareaPorId as jest.Mock).mockResolvedValue(task);
      (authRepo.obtenerUsuarioPorId as jest.Mock).mockResolvedValue(user);

      const result = await service.checkEditPermission(1, 10);

      expect(result).toEqual({
        puedeEditar: true,
        requiereAprobacion: true,
        tipoProyecto: 'Estrategico',
      });
    });

    it('should bypass approval for Admin on strategic projects', async () => {
      const task = {
        idTarea: 1,
        nombre: 'Strategic Task',
        idProyecto: 1,
        proyectoTipo: 'Estrategico',
        proyectoRequiereAprobacion: true,
      };
      const adminUser = { idUsuario: 1, rolGlobal: 'Admin' };

      (planningRepo.obtenerTareaPorId as jest.Mock).mockResolvedValue(task);
      (authRepo.obtenerUsuarioPorId as jest.Mock).mockResolvedValue(adminUser);

      const result = await service.checkEditPermission(1, 1);

      expect(result).toEqual({
        puedeEditar: true,
        requiereAprobacion: false,
        tipoProyecto: 'Estrategico',
      });
    });

    it('should allow free edit for operative projects', async () => {
      const task = {
        idTarea: 1,
        nombre: 'Operative Task',
        idProyecto: 2,
        proyectoTipo: 'Operativo',
        proyectoRequiereAprobacion: false,
      };
      (planningRepo.obtenerTareaPorId as jest.Mock).mockResolvedValue(task);

      const result = await service.checkEditPermission(1, 10);

      expect(result).toEqual({
        puedeEditar: true,
        requiereAprobacion: false,
        tipoProyecto: 'Operativo',
      });
    });

    it('should throw NotFoundException for non-existent task', async () => {
      (planningRepo.obtenerTareaPorId as jest.Mock).mockResolvedValue(null);

      await expect(service.checkEditPermission(999, 10)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ==================== solicitarCambio Tests ====================
  describe('solicitarCambio', () => {
    const existingTask = {
      idTarea: 1,
      nombre: 'Test Task',
      fechaObjetivo: '2024-01-15',
    };

    it('should create a change request', async () => {
      (planningRepo.obtenerTareaPorId as jest.Mock).mockResolvedValue(
        existingTask,
      );
      (authRepo.obtenerUsuarioPorId as jest.Mock).mockResolvedValue({
        idUsuario: 10,
        carnet: 'C123',
      });
      (planningRepo.crearSolicitudCambio as jest.Mock).mockResolvedValue({
        idSolicitud: 100,
      });

      const result = await service.solicitarCambio(
        10,
        1,
        'fechaObjetivo',
        '2024-02-15',
        'Need more time',
      );

      expect(planningRepo.crearSolicitudCambio).toHaveBeenCalledWith(
        expect.objectContaining({
          idTarea: 1,
          idUsuarioSolicitante: 10,
          campoAfectado: 'fechaObjetivo',
          valorAnterior: '2024-01-15',
          valorNuevo: '2024-02-15',
          motivo: 'Need more time',
          estado: 'Pendiente',
        }),
      );
    });

    it('should throw NotFoundException for non-existent task', async () => {
      (planningRepo.obtenerTareaPorId as jest.Mock).mockResolvedValue(null);

      await expect(
        service.solicitarCambio(10, 999, 'titulo', 'New', 'Reason'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== resolverSolicitud Tests ====================
  describe('resolverSolicitud', () => {
    const pendingSolicitud = {
      idSolicitud: 1,
      estado: 'Pendiente',
      idTarea: 10,
      campoAfectado: 'fechaObjetivo',
      valorNuevo: '2024-03-01',
    };

    it('should approve a request and apply changes', async () => {
      (authRepo.obtenerUsuarioPorId as jest.Mock).mockResolvedValue({
        idUsuario: 5,
        rolGlobal: 'Admin',
      });
      (planningRepo.obtenerSolicitudPorId as jest.Mock).mockResolvedValue(
        pendingSolicitud,
      );
      (planningRepo.actualizarTarea as jest.Mock).mockResolvedValue({});
      (planningRepo.actualizarEstadoSolicitud as jest.Mock).mockResolvedValue(
        {},
      );

      const result = await service.resolverSolicitud(5, 1, 'Aprobar');

      expect(planningRepo.actualizarTarea).toHaveBeenCalledWith(10, {
        fechaObjetivo: '2024-03-01',
      });
      expect(planningRepo.actualizarEstadoSolicitud).toHaveBeenCalledWith(
        1,
        'Aprobado',
        expect.any(String),
        5,
      );
      expect(auditService.log).toHaveBeenCalled();
    });

    it('should reject a request without applying changes', async () => {
      (authRepo.obtenerUsuarioPorId as jest.Mock).mockResolvedValue({
        idUsuario: 5,
        rolGlobal: 'Admin',
      });
      (planningRepo.actualizarEstadoSolicitud as jest.Mock).mockResolvedValue(
        {},
      );

      const result = await service.resolverSolicitud(5, 1, 'Rechazar');

      expect(planningRepo.actualizarTarea).not.toHaveBeenCalled();
      expect(planningRepo.actualizarEstadoSolicitud).toHaveBeenCalledWith(
        1,
        'Rechazado',
        expect.any(String),
        5,
      );
    });

    it('should throw NotFoundException for non-existent request', async () => {
      (authRepo.obtenerUsuarioPorId as jest.Mock).mockResolvedValue({
        idUsuario: 5,
        rolGlobal: 'Admin',
      });
      (planningRepo.obtenerSolicitudPorId as jest.Mock).mockResolvedValue(null);

      await expect(
        service.resolverSolicitud(5, 999, 'Aprobar'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== updateTareaOperativa Tests ====================
  describe('updateTareaOperativa', () => {
    it('should update operative task and create audit log', async () => {
      const task = {
        idTarea: 1,
        nombre: 'Operative Task',
        idProyecto: 2,
        proyectoTipo: 'Operativo',
      };
      (planningRepo.obtenerTareaPorId as jest.Mock).mockResolvedValue(task);
      (planningRepo.actualizarTarea as jest.Mock).mockResolvedValue({});

      const result = await service.updateTareaOperativa(10, 1, {
        nombre: 'Updated',
      });

      expect(planningRepo.actualizarTarea).toHaveBeenCalledWith(1, {
        nombre: 'Updated',
      });
    });

    it('should throw ForbiddenException for strategic tasks (if user is not admin)', async () => {
      const strategicTask = {
        idTarea: 1,
        nombre: 'Strategic Task',
        idProyecto: 1,
        proyectoTipo: 'Estrategico',
        proyectoRequiereAprobacion: true,
      };
      const normalUser = { idUsuario: 10, rolGlobal: 'User' };

      (planningRepo.obtenerTareaPorId as jest.Mock).mockResolvedValue(
        strategicTask,
      );
      (authRepo.obtenerUsuarioPorId as jest.Mock).mockResolvedValue(normalUser);

      await expect(
        service.updateTareaOperativa(10, 1, { nombre: 'Changed' }),
      ).rejects.toThrow(BadRequestException); // requires approval
    });
  });
});
