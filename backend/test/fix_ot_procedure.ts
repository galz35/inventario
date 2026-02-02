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

const migrationSteps = [
  // Ensure columns exist to match Backend expectations
  `IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'idCliente' AND Object_ID = Object_ID(N'Inv_ope_ot'))
        ALTER TABLE Inv_ope_ot ADD idCliente INT NULL;`,

  `IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'numeroCliente' AND Object_ID = Object_ID(N'Inv_ope_ot'))
        ALTER TABLE Inv_ope_ot ADD numeroCliente NVARCHAR(50) NULL;`,

  `IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'contactoNombre' AND Object_ID = Object_ID(N'Inv_ope_ot'))
        ALTER TABLE Inv_ope_ot ADD contactoNombre NVARCHAR(100) NULL;`,

  `IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'telefono' AND Object_ID = Object_ID(N'Inv_ope_ot'))
        ALTER TABLE Inv_ope_ot ADD telefono NVARCHAR(50) NULL;`,

  `IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'correo' AND Object_ID = Object_ID(N'Inv_ope_ot'))
        ALTER TABLE Inv_ope_ot ADD correo NVARCHAR(100) NULL;`,

  `IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'descripcionTrabajo' AND Object_ID = Object_ID(N'Inv_ope_ot'))
        ALTER TABLE Inv_ope_ot ADD descripcionTrabajo NVARCHAR(MAX) NULL;`,

  `IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'clienteNombreManual' AND Object_ID = Object_ID(N'Inv_ope_ot'))
        ALTER TABLE Inv_ope_ot ADD clienteNombreManual NVARCHAR(200) NULL;`,

  // Update SP to map parameters to REAL table columns
  `
    CREATE OR ALTER PROCEDURE [dbo].[Inv_sp_ot_crear]
        @idProyecto INT = NULL,
        @idCliente INT = NULL,
        @idTipoOT INT,
        @prioridad NVARCHAR(50), 
        @direccion NVARCHAR(255),
        @idUsuarioCrea INT,
        @notas NVARCHAR(MAX) = NULL,
        @numeroCliente NVARCHAR(50) = NULL,
        @contactoNombre NVARCHAR(100) = NULL,
        @telefono NVARCHAR(50) = NULL,
        @correo NVARCHAR(100) = NULL,
        @descripcionTrabajo NVARCHAR(MAX) = NULL,
        @clienteNombre NVARCHAR(200) = NULL
    AS
    BEGIN
        SET NOCOUNT ON;

        -- Mapping Logic:
        -- @direccion -> clienteDireccion
        -- @idTipoOT -> tipoOT (Converting to string if needed, or storing ID)
        -- @idCliente -> idCliente (Newly created column)
        
        INSERT INTO Inv_ope_ot (
            idProyecto, 
            idCliente, 
            tipoOT,  -- Mapped from @idTipoOT
            prioridad, 
            clienteDireccion, -- Mapped from @direccion
            idUsuarioCrea, 
            notas, 
            numeroCliente, 
            contactoNombre, 
            telefono, 
            correo, 
            descripcionTrabajo, 
            clienteNombreManual,
            fechaCreacion, 
            estado
        )
        VALUES (
            @idProyecto, 
            @idCliente, 
            CAST(@idTipoOT AS NVARCHAR(50)), -- Safe cast just in case
            @prioridad, 
            @direccion, 
            @idUsuarioCrea, 
            @notas, 
            @numeroCliente, 
            @contactoNombre, 
            @telefono, 
            @correo, 
            @descripcionTrabajo, 
            @clienteNombre,
            GETDATE(), 
            'REGISTRADA'
        );

        SELECT SCOPE_IDENTITY() as idOT;
    END
    `,
];

async function main() {
  try {
    const pool = await connect(dbConfig);
    console.log('✅ Connected to DB');

    for (const query of migrationSteps) {
      try {
        await pool.request().query(query);
        console.log('✅ Step executed successfully.');
      } catch (err: any) {
        console.error('❌ Step Failed:', err.message);
        // Continue? No, better stop to debug if SP fails.
      }
    }

    console.log('✅ Migration attempts finished.');
    pool.close();
  } catch (e: any) {
    console.error('❌ Critical Error:', e.message);
  }
}

main();
