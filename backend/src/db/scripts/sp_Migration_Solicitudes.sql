-- =============================================
-- MIGRACIÓN InventarioCore: SOLICITUDES DE CAMBIO
-- Fecha: 2026-01-25
-- Descripción: Tabla para flujo de aprobación en proyectos estratégicos
-- =============================================

IF OBJECT_ID('Inv_ope_proyecto_solicitudes_cambio', 'U') IS NULL
BEGIN
    CREATE TABLE Inv_ope_proyecto_solicitudes_cambio (
        idSolicitud INT IDENTITY(1,1) PRIMARY KEY,
        idTarea INT NOT NULL,
        idUsuarioSolicitante INT NOT NULL,
        campo NVARCHAR(50) NOT NULL,
        valorAnterior NVARCHAR(MAX),
        valorNuevo NVARCHAR(MAX),
        motivo NVARCHAR(MAX),
        estado NVARCHAR(20) DEFAULT 'Pendiente', -- Pendiente, Aprobado, Rechazado
        fechaSolicitud DATETIME DEFAULT GETDATE(),
        fechaResolucion DATETIME,
        idUsuarioResolutor INT,
        comentarioResolucion NVARCHAR(MAX),
        
        CONSTRAINT FK_Solicitudes_Tareas FOREIGN KEY (idTarea) REFERENCES Inv_ope_proyecto_tareas(idTarea),
        CONSTRAINT FK_Solicitudes_Usuario FOREIGN KEY (idUsuarioSolicitante) REFERENCES Inv_seg_usuarios(idUsuario)
    );
    
    CREATE INDEX IX_Solicitudes_Tarea ON Inv_ope_proyecto_solicitudes_cambio(idTarea);
    CREATE INDEX IX_Solicitudes_Estado ON Inv_ope_proyecto_solicitudes_cambio(estado);
END
GO


