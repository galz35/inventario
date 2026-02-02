import {
  ejecutarSP,
  Int,
  NVarChar,
  Decimal,
  DateTime,
  ejecutarQuery,
} from '../../db/base.repo';

export interface ProyectoTarea {
  idTarea?: number;
  idProyecto: number;
  idTareaPadre?: number;
  nombre: string;
  descripcion?: string;
  fechaInicioPrevista?: Date;
  fechaFinPrevista?: Date;
  estado?: string;
}

export interface MaterialEstimado {
  idTarea: number;
  productoId: number;
  cantidadEstimada: number;
  idAlmacenSugerido?: number;
}

/**
 * Crea una tarea en el WBS del proyecto
 */
export async function crearTarea(dto: ProyectoTarea) {
  const res = await ejecutarSP<{ idTarea: number }>(
    'Inv_sp_proyecto_tarea_crear',
    {
      idProyecto: { valor: dto.idProyecto, tipo: Int },
      idTareaPadre: { valor: dto.idTareaPadre || null, tipo: Int },
      nombre: { valor: dto.nombre, tipo: NVarChar },
      descripcion: { valor: dto.descripcion || null, tipo: NVarChar },
      fechaInicio: { valor: dto.fechaInicioPrevista || null, tipo: DateTime },
      fechaFin: { valor: dto.fechaFinPrevista || null, tipo: DateTime },
    },
  );
  return res[0];
}

/**
 * Actualiza una tarea existente
 */
export async function actualizarTarea(id: number, dto: any) {
  return await ejecutarQuery(
    `
        UPDATE Inv_ope_tareas
        SET nombre = @nombre,
            descripcion = @descripcion,
            fechaInicioPrevista = @fechaInicio,
            fechaFinPrevista = @fechaFin
        WHERE idTarea = @id
    `,
    {
      id: { valor: id, tipo: Int },
      nombre: { valor: dto.nombre, tipo: NVarChar },
      descripcion: { valor: dto.descripcion || null, tipo: NVarChar },
      fechaInicio: { valor: dto.fechaInicioPrevista || null, tipo: DateTime },
      fechaFin: { valor: dto.fechaFinPrevista || null, tipo: DateTime },
    },
  );
}

/**
 * Obtiene el árbol de tareas de un proyecto
 */
export async function obtenerWBS(idProyecto: number) {
  return await ejecutarSP('Inv_sp_proyecto_wbs_obtener', {
    idProyecto: { valor: idProyecto, tipo: Int },
  });
}

/**
 * Estima materiales para una tarea
 */
export async function estimarMateriales(dto: MaterialEstimado) {
  return await ejecutarSP('Inv_sp_proyecto_material_estimar', {
    idTarea: { valor: dto.idTarea, tipo: Int },
    productoId: { valor: dto.productoId, tipo: Int },
    cantidadEstimada: { valor: dto.cantidadEstimada, tipo: Decimal(18, 2) },
    idAlmacenSugerido: { valor: dto.idAlmacenSugerido || null, tipo: Int },
  });
}

/**
 * Obtiene la comparación entre lo estimado y lo real
 */
export async function obtenerPresupuestoVsReal(idProyecto: number) {
  return await ejecutarSP('Inv_sp_proyecto_presupuesto_vs_real', {
    idProyecto: { valor: idProyecto, tipo: Int },
  });
}

/**
 * Lista los proyectos activos (Nuevo)
 */

/**
 * Crea un nuevo proyecto
 */
export async function crearProyecto(dto: {
  nombre: string;
  descripcion?: string;
  idResponsable?: number;
  fechaInicio?: Date;
}) {
  // Si no tenemos SP, insertamos directo (temporal) o usamos SP si existiera
  return await ejecutarQuery(
    `
        INSERT INTO Inv_ope_proyectos (nombre, descripcion, idResponsable, fechaInicio, estado)
        VALUES (@nombre, @descripcion, @idResponsable, @fechaInicio, 'ACTIVO');
        SELECT SCOPE_IDENTITY() as idProyecto;
    `,
    {
      nombre: { valor: dto.nombre, tipo: NVarChar },
      descripcion: { valor: dto.descripcion, tipo: NVarChar },
      idResponsable: { valor: dto.idResponsable || null, tipo: Int },
      fechaInicio: { valor: dto.fechaInicio || new Date(), tipo: DateTime },
    },
  );
}

/**
 * Deshabilita un proyecto (Soft Delete)
 */
export async function eliminarProyecto(id: number) {
  return await ejecutarQuery(
    `
        UPDATE Inv_ope_proyectos SET estado = 'INACTIVO' WHERE idProyecto = @id
    `,
    {
      id: { valor: id, tipo: Int },
    },
  );
}

/**
 * Actualiza los datos de un proyecto
 */
export async function actualizarProyecto(
  id: number,
  dto: {
    nombre: string;
    descripcion?: string;
    idResponsable?: number;
    fechaInicio?: Date;
  },
) {
  return await ejecutarQuery(
    `
        UPDATE Inv_ope_proyectos 
        SET nombre = @nombre, 
            descripcion = @descripcion, 
            idResponsable = @idResponsable, 
            fechaInicio = @fechaInicio
        WHERE idProyecto = @id
    `,
    {
      id: { valor: id, tipo: Int },
      nombre: { valor: dto.nombre, tipo: NVarChar },
      descripcion: { valor: dto.descripcion || null, tipo: NVarChar },
      idResponsable: { valor: dto.idResponsable || null, tipo: Int },
      fechaInicio: { valor: dto.fechaInicio || null, tipo: DateTime },
    },
  );
}

/**
 * Asigna un usuario a una tarea
 */
export async function asignarUsuario(dto: {
  idTarea: number;
  idUsuario: number;
  rol: string;
}) {
  // Usamos el SP que vimos en la migración
  return await ejecutarSP('sp_Tarea_AsignarResponsable', {
    idTarea: { valor: dto.idTarea, tipo: Int },
    carnetUsuario: { valor: null, tipo: NVarChar }, // Si el SP requiere carnet, necesitariamos buscarlo. Pero asumamos que podemos adaptar o usar ID.
    // Espera: el SP sp_Tarea_AsignarResponsable usa @carnetUsuario.
    // Necesitamos obtener el carnet del usuario por ID primero O modificar el SP para aceptar ID.
    // Dado que no puedo cambiar el SP fácilmente sin ver si acepta NULL, haré query wrapper.

    // Mejor opcion: Insertar directo en Inv_ope_proyecto_tarea_asignados o usar wrapper
    // Vamos a hacer una query directa para evitar complicaciones con el SP de carnet si no tenemos el carnet
    tipo: { valor: dto.rol, tipo: NVarChar },
    esReasignacion: { valor: 0, tipo: Int }, // Boolean 0
  });
}

// Wrapper para asignar por ID directamente (bypass carnet requirement if SP is strict)
export async function asignarUsuarioPorId(dto: {
  idTarea: number;
  idUsuario: number;
  rol: string;
}) {
  return await ejecutarQuery(
    `
        IF NOT EXISTS (SELECT 1 FROM Inv_ope_tarea_asignaciones WHERE idTarea = @idTarea AND idUsuario = @idUsuario)
        BEGIN
            DECLARE @carnet NVARCHAR(50);
            -- Try to get carnet if possible, otherwise null
            SELECT TOP 1 @carnet = carnet FROM Inv_seg_usuarios WHERE idUsuario = @idUsuario;
 
            INSERT INTO Inv_ope_tarea_asignaciones (idTarea, idUsuario, carnet, tipo, fechaAsignacion)
            VALUES (@idTarea, @idUsuario, @carnet, @rol, GETDATE())
        END
        ELSE
        BEGIN
             UPDATE Inv_ope_tarea_asignaciones SET tipo = @rol WHERE idTarea = @idTarea AND idUsuario = @idUsuario
        END
    `,
    {
      idTarea: { valor: dto.idTarea, tipo: Int },
      idUsuario: { valor: dto.idUsuario, tipo: Int },
      rol: { valor: dto.rol, tipo: NVarChar },
    },
  );
}

export async function listarProyectos() {
  return await ejecutarQuery(`
        SELECT 
            p.idProyecto, 
            p.nombre, 
            p.descripcion, 
            p.idResponsable,
            u.nombre as responsableNombre,
            p.fechaInicio, 
            p.fechaFin, 
            p.estado 
        FROM Inv_ope_proyectos p
        LEFT JOIN Inv_seg_usuarios u ON p.idResponsable = u.idUsuario
        ORDER BY p.estado ASC, p.nombre
    `);
}

/**
 * Obtiene el historial de eventos del proyecto (Asignaciones, etc.)
 */
export async function obtenerHistorialProyecto(idProyecto: number) {
  return await ejecutarQuery(
    `
        SELECT 
            'ASIGNACION' as tipo,
            t.nombre as tarea,
            u.nombre as detalle,
            a.tipo as extra,
            a.fechaAsignacion as fecha
        FROM Inv_ope_tarea_asignaciones a
        JOIN Inv_ope_tareas t ON a.idTarea = t.idTarea
        JOIN Inv_seg_usuarios u ON a.idUsuario = u.idUsuario
        WHERE t.idProyecto = @id
        ORDER BY a.fechaAsignacion DESC
    `,
    {
      id: { valor: idProyecto, tipo: Int },
    },
  );
}
/**
 * Obtiene los recursos asignados a una tarea (Personas y Materiales)
 */
export async function obtenerRecursosTarea(idTarea: number) {
  const personal = await ejecutarQuery(
    `
        SELECT a.idAsignacion, u.nombre, a.tipo as rol, a.fechaAsignacion, a.carnet
        FROM Inv_ope_tarea_asignaciones a
        JOIN Inv_seg_usuarios u ON a.idUsuario = u.idUsuario
        WHERE a.idTarea = @id
    `,
    { id: { valor: idTarea, tipo: Int } },
  );

  const materiales = await ejecutarQuery(
    `
        SELECT e.idEstimacion, p.nombre as productoNombre, e.cantidad, al.nombre as almacenNombre
        FROM Inv_ope_estimaciones e
        JOIN Inv_cat_productos p ON e.productoId = p.idProducto
        LEFT JOIN Inv_cat_almacenes al ON e.idAlmacenSugerido = al.idAlmacen
        WHERE e.idTarea = @id
    `,
    { id: { valor: idTarea, tipo: Int } },
  );

  return { personal, materiales };
}
