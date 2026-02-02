-- =============================================
-- FIX_SPs_PRESENTACION.sql
-- Optimización y Estabilización Final para Demo
-- =============================================
USE inventario;
GO

-- 1. SP: Listado de OTs con Filtros (El que faltaba)
CREATE OR ALTER PROCEDURE [dbo].[Inv_sp_ot_listar_filtro]
    @idTecnico INT = NULL,
    @estado NVARCHAR(50) = NULL,
    @fechaInicio DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        ot.*, 
        p.nombre as proyectoNombre, 
        u.nombre as tecnicoNombre
    FROM Inv_ope_ot ot
    LEFT JOIN Inv_ope_proyectos p ON ot.idProyecto = p.idProyecto
    LEFT JOIN Inv_seg_usuarios u ON ot.idTecnicoAsignado = u.idUsuario
    WHERE (@idTecnico IS NULL OR ot.idTecnicoAsignado = @idTecnico)
      AND (@estado IS NULL OR ot.estado = @estado)
      AND (@fechaInicio IS NULL OR ot.fechaCreacion >= @fechaInicio)
    ORDER BY ot.fechaCreacion DESC;
END
GO

-- 2. SP: Cierre de Órdenes de Trabajo (Corrección de Nombres)
CREATE OR ALTER PROCEDURE [dbo].[Inv_sp_ot_cerrar]
    @idOT INT,
    @idUsuarioCierra INT,
    @notas NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Inv_ope_ot
    SET estado = 'CERRADA',
        fechaCierre = GETDATE(),
        idUsuarioCierra = @idUsuarioCierra,
        notasCierre = @notas
    WHERE idOT = @idOT;
END
GO

-- 3. SP: Registrar Consumo en OT
CREATE OR ALTER PROCEDURE [dbo].[Inv_sp_ot_consumo_registrar]
    @idOT INT,
    @productoId INT,
    @cantidad DECIMAL(18,2),
    @idMovimientoInventario INT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Inv_ope_ot_consumos (idOT, productoId, cantidad, idMovimientoInventario, fechaRegistro)
    VALUES (@idOT, @productoId, @cantidad, @idMovimientoInventario, GETDATE());
END
GO

PRINT '✅ Script de SPs para presentación generado y listo.';
GO
