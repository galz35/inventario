CREATE   PROCEDURE Inv_sp_inv_movimiento_crear_header
    @tipoMovimiento NVARCHAR(50),
    @almacenOrigenId INT = NULL,
    @almacenDestinoId INT = NULL,
    @idUsuarioResponsable INT,
    @notas NVARCHAR(MAX) = NULL,
    @referenciaTexto NVARCHAR(100) = NULL
AS
BEGIN
    INSERT INTO Inv_inv_movimientos (
        tipoMovimiento, almacenOrigenId, almacenDestinoId, 
        idUsuarioResponsable, notas, referenciaTexto, fechaMovimiento, estado
    )
    OUTPUT INSERTED.idMovimiento
    VALUES (
        @tipoMovimiento, @almacenOrigenId, @almacenDestinoId, 
        @idUsuarioResponsable, @notas, @referenciaTexto, GETDATE(), 'APLICADO'
    );
END
GO