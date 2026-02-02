import { sql, connect } from 'mssql';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Hardcoded config to avoid dotenv issues in test environment sometimes
const dbConfig = {
  user: 'plan',
  password: 'admin123',
  server: '54.146.235.205',
  database: 'inventario',
  options: {
    encrypt: true, // RDS usually requires encryption
    trustServerCertificate: true,
  },
};

async function main() {
  try {
    const pool = await connect(dbConfig);
    console.log('✅ Conectado a DB');

    // Check if user exists
    const user = await pool
      .request()
      .query('SELECT TOP 1 idUsuario FROM Inv_seg_usuarios');
    if (user.recordset.length === 0) {
      console.error('❌ No hay usuarios. Login fallará.');
      // Insert user?
    } else {
      const idUser = user.recordset[0].idUsuario;

      // Upsert Project
      const pCheck = await pool
        .request()
        .query(
          "SELECT * FROM Inv_ope_proyectos WHERE nombre = 'Proyecto Force Seed'",
        );
      if (pCheck.recordset.length === 0) {
        await pool.request().query(`
                    INSERT INTO Inv_ope_proyectos (nombre, descripcion, idResponsable, estado, fechaInicio, fechaFin)
                    VALUES ('Proyecto Force Seed', 'Forzado para test', ${idUser}, 'ACTIVO', GETDATE(), DATEADD(day, 60, GETDATE()))
                `);
        console.log('✅ Proyecto creado.');
      } else {
        console.log('✅ Proyecto ya existe.');
      }
    }

    pool.close();
  } catch (e: any) {
    console.error('Error:', e.message);
  }
}

main();
