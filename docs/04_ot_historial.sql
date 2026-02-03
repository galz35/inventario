
IF OBJECT_ID('Inv_ope_ot_historial', 'U') IS NULL
CREATE TABLE Inv_ope_ot_historial (
    idHistorial INT IDENTITY(1,1) PRIMARY KEY,
    idOT INT NOT NULL REFERENCES Inv_ope_ot(idOT),
    accion NVARCHAR(50), -- CREACION, ASIGNACION, ACTUALIZACION, CIERRE
    estado NVARCHAR(50),
    notas NVARCHAR(MAX),
    idUsuario INT NULL REFERENCES Inv_seg_usuarios(idUsuario),
    fecha DATETIME DEFAULT GETDATE(),
    cambios NVARCHAR(MAX) -- JSON o texto describiendo cambios
);
