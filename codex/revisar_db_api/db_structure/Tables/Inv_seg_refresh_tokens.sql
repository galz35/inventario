CREATE TABLE [dbo].[Inv_seg_refresh_tokens] (
    [idToken] int IDENTITY(1,1) NOT NULL,
    [idUsuario] int NOT NULL,
    [token] nvarchar(500) NOT NULL,
    [expira] datetime NOT NULL,
    [creado] datetime NULL DEFAULT (getdate()),
    [revocado] datetime NULL
);
GO
