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

    // Create Tables if Missing (Manual Fix)
    const checkCli = await pool
      .request()
      .query("SELECT OBJECT_ID('Inv_cat_clientes', 'U') as id");
    if (!checkCli.recordset[0].id) {
      console.log('⚠️ Creando tabla Inv_cat_clientes...');
      await pool.request().query(`
                CREATE TABLE Inv_cat_clientes (
                    idCliente INT IDENTITY(1,1) PRIMARY KEY,
                    nombre NVARCHAR(150),
                    identificacion NVARCHAR(50), 
                    direccion NVARCHAR(250),
                    telefono NVARCHAR(20),
                    email NVARCHAR(100),
                    activo BIT DEFAULT 1
                )
            `);
    }

    const checkTipo = await pool
      .request()
      .query("SELECT OBJECT_ID('Inv_cat_tipos_ot', 'U') as id");
    if (!checkTipo.recordset[0].id) {
      console.log('⚠️ Creando tabla Inv_cat_tipos_ot...');
      await pool.request().query(`
                CREATE TABLE Inv_cat_tipos_ot (
                    idTipoOT INT IDENTITY(1,1) PRIMARY KEY,
                    nombre NVARCHAR(100) NOT NULL,
                    descripcion NVARCHAR(255),
                    slaHoras INT DEFAULT 24,
                    prioridadDefault NVARCHAR(20),
                    requiereFirma BIT DEFAULT 0,
                    requiereEvidencia BIT DEFAULT 0,
                    activo BIT DEFAULT 1
                )
            `);
    }

    // FORCE SEED CATÁLOGOS

    // 1. Clientes
    const cli = await pool
      .request()
      .query("SELECT 1 FROM Inv_cat_clientes WHERE nombre = 'Cliente Test'");
    if (cli.recordset.length === 0) {
      await pool.request().query(`
                INSERT INTO Inv_cat_clientes (nombre, direccion, telefono, email, activo) 
                VALUES ('Cliente Test', 'Calle Test 123', '555-0000', 'cliente@test.com', 1)
            `);
      console.log('✅ Cliente insertado.');
    } else {
      console.log('✅ Cliente ya existe.');
    }

    // 2. Tipos OT
    const tipo = await pool
      .request()
      .query(
        "SELECT 1 FROM Inv_cat_tipos_ot WHERE nombre = 'Instalación Básica'",
      );
    if (tipo.recordset.length === 0) {
      await pool.request().query(`
                INSERT INTO Inv_cat_tipos_ot (nombre, slaHoras, requiereFirma, requiereEvidencia, activo) 
                VALUES ('Instalación Básica', 48, 0, 0, 1)
            `);
      console.log('✅ Tipo OT insertado.');
    } else {
      console.log('✅ Tipo OT ya existe.');
    }

    // 3. Update Proyecto (si falta estado)
    await pool
      .request()
      .query(
        "UPDATE Inv_ope_proyectos SET estado = 'ACTIVO' WHERE estado IS NULL",
      );

    pool.close();
  } catch (e: any) {
    console.error('Error:', e.message);
  }
}

main();
