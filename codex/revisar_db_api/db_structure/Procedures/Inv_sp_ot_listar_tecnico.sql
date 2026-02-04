CREATE   PROCEDURE Inv_sp_ot_listar_tecnico @idTecnico INT = NULL AS BEGIN SELECT * FROM Inv_ope_ot WHERE (@idTecnico IS NULL OR idTecnicoAsignado = @idTecnico) ORDER BY fechaCreacion DESC END
GO