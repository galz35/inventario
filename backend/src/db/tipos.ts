/**
 * Tipos e interfaces para la capa de datos
 */

// Tipo genérico para resultados paginados
export interface ResultadoPaginado<T> {
  datos: T[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
}

// Interface base para entidades con ID
export interface EntidadBase {
  id?: number;
  fechaCreacion?: Date;
  fechaActualizacion?: Date;
}

// Usuario (mapeado desde Inv_seg_usuarios)
export interface UsuarioDb {
  idUsuario: number;
  nombre: string | null;
  nombreCompleto: string | null;
  correo: string;
  telefono: string | null;
  activo: boolean;
  rolGlobal: string;
  idRol: number | null;
  carnet: string | null;
  cargo: string | null;
  departamento: string | null;
  orgDepartamento: string | null;
  orgGerencia: string | null;
  idOrg: string | null;
  jefeCarnet: string | null;
  jefeNombre: string | null;
  jefeCorreo: string | null;
  fechaIngreso: Date | null;
  fechaCreacion: Date;
  genero: string | null;
  username: string | null;
  pais: string;
  area: string | null;
  gerencia: string | null;
  subgerencia: string | null;
}

// Credenciales (mapeado desde Inv_seg_usuariosCredenciales)
export interface CredencialesDb {
  idCredencial: number;
  idUsuario: number;
  passwordHash: string;
  ultimoLogin: Date | null;
  refreshTokenHash: string | null;
}

// Rol (mapeado desde Inv_seg_roles)
export interface RolDb {
  idRol: number;
  nombre: string;
  descripcion: string | null;
  esSistema: boolean;
  reglas: string;
  defaultMenu: string | null;
}

// Proyecto (mapeado desde Inv_ope_proyectos)
export interface ProyectoDb {
  idProyecto: number;
  nombre: string;
  descripcion: string | null;
  idNodoDuenio: number | null;
  fechaCreacion: Date;
  pais: string;
  tipo: string;
  estado: string;
  requiereAprobacion: boolean;
  enllavado: boolean;
  fechaInicio: Date | null;
  fechaFin: Date | null;
  area: string | null;
  subgerencia: string | null;
  gerencia: string | null;
  idCreador?: number;
  progreso?: number;
}

// Tarea (mapeado desde Inv_ope_proyecto_tareas)
export interface TareaDb {
  idTarea: number;
  idProyecto: number;
  nombre: string;
  descripcion: string | null;
  estado: string;
  prioridad: string;
  fechaCreacion: Date;
  fechaObjetivo: Date | null;
  fechaCompletado: Date | null;
  porcentaje: number;
  idPadre: number | null;
  orden: number;
  esHito: boolean;
  idAsignado: number | null;
  idPlan: number | null;
  semana: number | null;
  // Campos añadidos en migración v2
  tipo?: string;
  esfuerzo?: string;
  fechaInicioPlanificada?: Date;
  idCreador?: number;
  // Campos añadidos para tipos A/B/C
  comportamiento?: 'SIMPLE' | 'RECURRENTE' | 'LARGA';
  idGrupo?: number;
  numeroParte?: number;
  fechaInicioReal?: Date;
  fechaFinReal?: Date;
  linkEvidencia?: string;
  creadorCarnet?: string;
  asignadoCarnet?: string;
}

// Recurrencia de tarea (mapeado desde p_TareaRecurrencia)
export interface TareaRecurrenciaDb {
  id: number;
  idTarea: number;
  tipoRecurrencia: 'SEMANAL' | 'MENSUAL';
  diasSemana: string | null; // '1,2,3,4,5' (lun-vie ISO)
  diaMes: number | null;
  fechaInicioVigencia: Date;
  fechaFinVigencia: Date | null;
  activo: boolean;
  fechaCreacion: Date;
  idCreador: number;
  carnet?: string;
}

// Instancia de recurrencia (mapeado desde p_TareaInstancia)
export interface TareaInstanciaDb {
  id: number;
  idTarea: number;
  idRecurrencia: number | null;
  fechaProgramada: Date;
  fechaEjecucion: Date | null;
  estadoInstancia: 'PENDIENTE' | 'HECHA' | 'OMITIDA' | 'REPROGRAMADA';
  comentario: string | null;
  idUsuarioEjecutor: number | null;
  fechaRegistro: Date;
  fechaReprogramada: Date | null;
  esInstanciaReal?: boolean; // Calculado en query
  carnet?: string;
}

// Avance mensual (mapeado desde p_TareaAvanceMensual) - Solo Plan de Trabajo
export interface TareaAvanceMensualDb {
  id: number;
  idTarea: number;
  mes: number;
  anio: number;
  porcentajeMes: number; // DECIMAL en DB
  porcentajeAcumulado?: number; // Calculado con SUM()
  comentario: string | null;
  idUsuarioActualizador: number;
  fechaActualizacion: Date;
}

// Check-in (mapeado desde Inv_ope_checkins)
export interface CheckinDb {
  idCheckin: number;
  idUsuario: number;
  fecha: Date;
  entregableTexto: string;
  nota: string | null;
  linkEvidencia: string | null;
  estadoAnimo: string | null;
  idNodo: number | null;
  fechaCreacion: Date;
  usuariocarnet: string | null;
}

// Bloqueo (mapeado desde Inv_ope_proyecto_bloqueos)
export interface BloqueoDb {
  idBloqueo: number;
  idUsuario: number;
  descripcion: string;
  fechaCreacion: Date;
  fechaResolucion: Date | null;
  estado: string;
  resolucion: string | null;
  idResueltoPor: number | null;
  prioridad: string;
  carnetOrigen?: string;
  carnetDestino?: string;
}

// Plan de Trabajo (mapeado desde Inv_ope_planes_trabajo)
export interface PlanTrabajoDb {
  idPlan: number;
  idUsuario: number;
  mes: number;
  anio: number;
  objetivos: string | null;
  estado: string;
  idCreador: number | null;
  fechaCreacion: Date;
  fechaActualizacion: Date | null;
  carnet: string | null;
}

// Solicitud de Cambio (mapeado desde p_SolicitudCambios)
export interface SolicitudCambioDb {
  id: number;
  idTarea: number;
  idUsuarioSolicitante: number;
  campoAfectado: string;
  valorAnterior: string | null;
  valorNuevo: string | null;
  motivo: string | null;
  estado: string;
  resolucion: string | null;
  idResueltoPor: number | null;
  fechaSolicitud: Date;
  fechaResolucion: Date | null;
}

// Organización (mapeado desde Inv_seg_usuariosOrganizacion)
export interface UsuarioOrganizacionDb {
  id: number;
  idUsuario: number;
  idNodo: number;
  rol: string;
  fechaAsignacion: Date;
}

// Organización Nodo (mapeado desde Inv_cat_organigramas)
export interface OrganizacionNodoDb {
  id: number;
  nombre: string;
  tipo: string;
  idPadre: number | null;
  orden: number;
  activo: boolean;
}

// Usuario Config (mapeado desde Inv_seg_usuariosConfig)
export interface UsuarioConfigDb {
  id: number;
  idUsuario: number;
  menuPersonalizado: string | null; // JSON string
  temasPreferidos: string | null;
  notificaciones: boolean;
}

// Seguridad Perfil (mapeado desde Inv_seg_perfiles)
export interface SeguridadPerfilDb {
  id: number;
  nombre: string;
  permisos: string | null; // JSON string
  activo: boolean;
}

// Log Sistema (mapeado desde Inv_sis_logs)
export interface LogSistemaDb {
  id: number;
  idUsuario: number | null;
  accion: string;
  entidad: string | null;
  datos: string | null;
  fecha: Date;
}

// Audit Log (mapeado desde p_Auditoria)
export interface AuditLogDb {
  id: number;
  idUsuario: number | null;
  accion: string;
  entidad: string | null;
  entidadId: string | null;
  datosAnteriores: string | null;
  datosNuevos: string | null;
  fecha: Date;
}

// ==========================================
// MÓDULO ACCESO / RRHH
// ==========================================

// Organizacion Nodo RH (mapeado desde p_organizacion_nodos)
export interface OrganizacionNodoRhDb {
  idorg: number; // BigInt en DB, number en JS (cuidado con overflow si > 2^53)
  padre: number | null;
  descripcion: string | null;
  tipo: string | null;
  estado: string | null;
  nivel: string | null;
  updated_at: Date;
}

// Permiso Area (Inv_seg_permisos_area)
export interface PermisoAreaDb {
  id: number;
  carnet_otorga: string | null;
  carnet_recibe: string;
  idorg_raiz: number;
  alcance: string;
  activo: boolean;
  fecha_inicio: Date | null;
  fecha_fin: Date | null;
  motivo: string | null;
  creado_en: Date;
}

// Permiso Empleado (Inv_seg_permisos_empleado)
export interface PermisoEmpleadoDb {
  id: number;
  carnet_otorga: string | null;
  carnet_recibe: string;
  carnet_objetivo: string;
  activo: boolean;
  fecha_inicio: Date | null;
  fecha_fin: Date | null;
  motivo: string | null;
  creado_en: Date;
  tipo_acceso: string;
}

// Delegacion Visibilidad (Inv_seg_delegaciones)
export interface DelegacionVisibilidadDb {
  id: number;
  carnet_delegante: string;
  carnet_delegado: string;
  activo: boolean;
  fecha_inicio: Date | null;
  fecha_fin: Date | null;
  motivo: string | null;
  creado_en: Date;
}
