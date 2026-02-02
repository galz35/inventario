import { sql, connect } from 'mssql';

const dbConfig = {
  user: 'plan',
  password: 'admin123',
  server: '54.146.235.205',
  database: 'inventario',
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

async function main() {
  try {
    const pool = await connect(dbConfig);
    console.log('✅ Conectado a DB');

    console.log('🛠️ Verificando tablas de Auditoría...');

    // 1. Inv_sis_logs
    const checkLogs = await pool
      .request()
      .query("SELECT OBJECT_ID('Inv_sis_logs', 'U') as id");
    if (!checkLogs.recordset[0].id) {
      console.log('   Creando Inv_sis_logs...');
      await pool.request().query(`
                CREATE TABLE Inv_sis_logs (
                    idLog INT IDENTITY(1,1) PRIMARY KEY,
                    idUsuario INT NULL,
                    accion NVARCHAR(100),
                    entidad NVARCHAR(100),
                    datos NVARCHAR(MAX),
                    fecha DATETIME DEFAULT GETDATE()
                )
            `);
    } else {
      console.log('   Inv_sis_logs ya existe.');
    }

    // 2. Inv_sis_auditoria
    const checkAudit = await pool
      .request()
      .query("SELECT OBJECT_ID('Inv_sis_auditoria', 'U') as id");
    if (!checkAudit.recordset[0].id) {
      console.log('   Creando Inv_sis_auditoria...');
      await pool.request().query(`
                CREATE TABLE Inv_sis_auditoria (
                    idAuditoria INT IDENTITY(1,1) PRIMARY KEY,
                    idUsuario INT NULL,
                    accion NVARCHAR(100),
                    entidad NVARCHAR(100),
                    entidadId NVARCHAR(50),
                    datosAnteriores NVARCHAR(MAX),
                    datosNuevos NVARCHAR(MAX),
                    fecha DATETIME DEFAULT GETDATE()
                )
            `);
    } else {
      console.log('   Inv_sis_auditoria ya existe.');
    }

    pool.close();
    console.log('✅ Verificación completada.');
  } catch (e: any) {
    console.error('❌ Error Fixing Tables:', e.message);
  }
}

main();
