/* 1) “Reset” suave (solo desconecta/reconecta la BD)
   En AWS RDS NO puedes SINGLE_USER si backup retention > 0,
   así que esta opción puede fallar ahí.
*/
ALTER DATABASE Bdplaner SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
ALTER DATABASE Bdplaner SET MULTI_USER;
sql
Copiar código
/* 2) Limpiar corrupción lógica de estadísticas/índices (no borra datos) */
USE Bdplaner;
GO
EXEC sp_updatestats;
GO
-- Opcional por tabla crítica:
-- UPDATE STATISTICS dbo.Inv_ope_proyectos WITH FULLSCAN;
sql
Copiar código
/* 3) Reparar consistencia (solo valida / no “arregla” automáticamente) */
DBCC CHECKDB('Bdplaner') WITH NO_INFOMSGS;
