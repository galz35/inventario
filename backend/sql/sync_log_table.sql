IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='inv_SyncLog' AND xtype='U')
BEGIN
    CREATE TABLE inv_SyncLog (
        id INT IDENTITY(1,1) PRIMARY KEY,
        device_id NVARCHAR(100) NOT NULL,
        user_id INT NOT NULL,
        sync_type NVARCHAR(20) NOT NULL, -- 'push' o 'pull'
        success_count INT DEFAULT 0,
        error_count INT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        
        INDEX IX_SyncLog_Device (device_id, user_id, created_at DESC)
    );
END
