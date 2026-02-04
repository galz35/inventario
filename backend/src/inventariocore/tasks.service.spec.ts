import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { PlanningService } from '../planning/planning.service';
import { AuditService } from '../common/audit.service';
import { VisibilidadService } from '../acceso/visibilidad.service';
import { RecurrenciaService } from './recurrencia.service';

// Mock de Repositorios (estos son módulos, no clases inyectadas)
jest.mock('./inventariocore.repo', () => ({
  obtenerCheckinPorFecha: jest.fn(),
  obtenerMisTareas: jest.fn(),
  upsertCheckin: jest.fn(),
  crearTarea: jest.fn(),
  asignarUsuarioTarea: jest.fn(),
  obtenerTareasMultiplesUsuarios: jest.fn(),
  obtenerEquipoHoy: jest.fn(),
  bloquearTarea: jest.fn(),
  resolverBloqueo: jest.fn(),
  ejecutarQuery: jest.fn(),
  getTareasUsuario: jest.fn(),
  obtenerBacklog: jest.fn(),
}));

jest.mock('../planning/planning.repo', () => ({
  obtenerTareaPorId: jest.fn(),
  actualizarTarea: jest.fn(),
  obtenerTodosProyectos: jest.fn(),
  obtenerProyectosVisibles: jest.fn(),
  crearProyecto: jest.fn(),
  obtenerProyectoPorId: jest.fn(),
  actualizarDatosProyecto: jest.fn(),
  eliminarProyecto: jest.fn(),
}));

jest.mock('../auth/auth.repo', () => ({
  obtenerUsuarioPorId: jest.fn(),
}));

jest.mock('./tasks.repo', () => ({
  recalcularJerarquia: jest.fn(),
  crearAvance: jest.fn(),
  crearTarea: jest.fn(),
}));

// Importar los mocks para poder configurar sus retornos
import * as InventarioCoreRepo from './inventariocore.repo';
import * as planningRepo from '../planning/planning.repo';
import * as authRepo from '../auth/auth.repo';
import * as tasksRepo from './tasks.repo';

describe('TasksService', () => {
  let service: TasksService;
  let planningService: PlanningService;
  let auditService: AuditService;
  let visibilidadService: VisibilidadService;

  const mockPlanningService = {
    checkEditPermission: jest.fn(),
    solicitarCambio: jest.fn(),
  };

  const mockAuditService = {
    log: jest.fn(),
    getHistorialEntidad: jest.fn(),
  };

  const mockVisibilidadService = {
    verificarAccesoPorId: jest.fn(),
    obtenerEmpleadosVisibles: jest.fn(),
    obtenerCarnetPorId: jest.fn(),
  };

  const mockRecurrenciaService = {
    generarRecurrencias: jest.fn(),
    obtenerAgendaRecurrente: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: PlanningService, useValue: mockPlanningService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: VisibilidadService, useValue: mockVisibilidadService },
        { provide: RecurrenciaService, useValue: mockRecurrenciaService },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    planningService = module.get<PlanningService>(PlanningService);
    auditService = module.get<AuditService>(AuditService);
    visibilidadService = module.get<VisibilidadService>(VisibilidadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('miDiaGet', () => {
    it('should return day snapshot', async () => {
      const mockCheckin = { idCheckin: 1, entregableTexto: 'Test' };
      const mockTareas = [{ idTarea: 1, titulo: 'Task 1' }];
      const mockAgenda = [{ id: 1, titulo: 'Rec' }];
      const mockBacklog = [{ idTarea: 2, titulo: 'Backlog' }];

      (
        InventarioCoreRepo.obtenerCheckinPorFecha as jest.Mock
      ).mockResolvedValue(mockCheckin);
      (InventarioCoreRepo.getTareasUsuario as jest.Mock).mockResolvedValue(
        mockTareas,
      );
      (InventarioCoreRepo.obtenerBacklog as jest.Mock).mockResolvedValue(
        mockBacklog,
      );
      mockRecurrenciaService.obtenerAgendaRecurrente.mockResolvedValue(
        mockAgenda,
      );

      const result = await service.miDiaGet(1, '2024-01-23');

      expect(result.checkinHoy).toEqual(mockCheckin);
      expect(result.tareasSugeridas).toEqual(mockTareas);
    });
  });

  describe('tareaCrearRapida', () => {
    it('should create and assign a task', async () => {
      const dto = { idUsuario: 1, titulo: 'New Task', idProyecto: 5 };
      mockVisibilidadService.obtenerCarnetPorId.mockResolvedValue('C1');
      (tasksRepo.crearTarea as jest.Mock).mockResolvedValue(100);
      (planningRepo.obtenerTareaPorId as jest.Mock).mockResolvedValue({
        idTarea: 100,
        nombre: 'New Task',
      });

      const result = await service.tareaCrearRapida(dto as any);

      expect(tasksRepo.crearTarea).toHaveBeenCalled();
      expect(result.idTarea).toBe(100);
    });
  });

  describe('registrarAvance', () => {
    it('should update progress and log audit', async () => {
      const mockTarea = { idTarea: 1, porcentaje: 0 };
      (planningRepo.obtenerTareaPorId as jest.Mock).mockResolvedValue(
        mockTarea,
      );

      await service.registrarAvance(1, 50, 'Halfway there', 1);

      expect(planningRepo.actualizarTarea).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ porcentaje: 50 }),
      );
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: 'TAREA_ACTUALIZADA',
          recursoId: '1',
        }),
      );
    });
  });
});
