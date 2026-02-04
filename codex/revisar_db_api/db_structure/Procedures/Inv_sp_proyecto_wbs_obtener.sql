
            CREATE   PROCEDURE Inv_sp_proyecto_wbs_obtener
                @idProyecto INT
            AS
            BEGIN
                SET NOCOUNT ON;
                SELECT 
                    t.idTarea,
                    t.idProyecto,
                    t.idTareaPadre,
                    t.nombre,
                    t.descripcion,
                    t.fechaInicioPrevista,
                    t.fechaFinPrevista,
                    t.estado,
                    (SELECT COUNT(*) FROM Inv_ope_tareas sub WHERE sub.idTareaPadre = t.idTarea) as hasChildren
                FROM Inv_ope_tareas t
                WHERE t.idProyecto = @idProyecto
                ORDER BY t.idTareaPadre, t.orden, t.idTarea;
            END
        
GO