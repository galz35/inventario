CREATE TABLE [dbo].[Inv_p_SlowQueries] (
    [idLog] int IDENTITY(1,1) NOT NULL,
    [duracionMS] int NOT NULL,
    [sqlText] nvarchar(max) NOT NULL,
    [tipo] nvarchar(20) NULL,
    [parametros] nvarchar(max) NULL,
    [fecha] datetime NULL DEFAULT (getdate()),
    [origen] nvarchar(200) NULL
);
GO
