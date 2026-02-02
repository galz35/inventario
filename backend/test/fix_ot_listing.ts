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

    // Create Inv_sp_ot_listar_tecnico
    console.log('🛠️ Creando Inv_sp_ot_listar_tecnico...');
    await pool.request().query(`
            CREATE OR ALTER PROCEDURE Inv_sp_ot_listar_tecnico
                @idTecnico INT = NULL
            AS
            BEGIN
                SELECT * FROM Inv_ope_ot 
                WHERE (@idTecnico IS NULL OR idTecnicoAsignado = @idTecnico)
                ORDER BY fechaCreacion DESC
            END
        `);

    // Create Inv_sp_ot_listar_filtro
    console.log('🛠️ Creando Inv_sp_ot_listar_filtro...');
    await pool.request().query(`
            CREATE OR ALTER PROCEDURE Inv_sp_ot_listar_filtro
                @idTecnico INT = NULL,
                @estado NVARCHAR(20) = NULL,
                @fechaInicio DATETIME = NULL
            AS
            BEGIN
                SELECT * FROM Inv_ope_ot 
                WHERE (@idTecnico IS NULL OR idTecnicoAsignado = @idTecnico)
                  AND (@estado IS NULL OR estado = @estado)
                  AND (@fechaInicio IS NULL OR fechaCreacion >= @fechaInicio)
                ORDER BY fechaCreacion DESC
            END
        `);

    console.log('✅ SPs de Listado Creados.');
    pool.close();
  } catch (e: any) {
    console.error('Error:', e.message);
  }
}

main();
