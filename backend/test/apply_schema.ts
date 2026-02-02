import { sql, connect } from 'mssql';
import * as fs from 'fs';
import * as path from 'path';

const dbConfig = {
  user: 'sa',
  password: 'Password123!',
  server: 'localhost',
  database: 'inventario',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

async function main() {
  try {
    const pool = await connect(dbConfig);
    console.log('✅ Conectado a DB');

    const sqlPath = path.join(__dirname, '../../docs/diseno_db_fase1.sql');
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`No encontrado: ${sqlPath}`);
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    const batches = sqlContent.split(/^GO/gm);

    console.log(`📜 Aplicando esquema (${batches.length} bloques)...`);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i].trim();
      if (!batch) continue;
      try {
        await pool.request().query(batch);
        process.stdout.write('.');
      } catch (e: any) {
        // Ignorar errores de "ya existe"
        if (
          e.message.includes('already exists') ||
          e.message.includes('ya existe')
        ) {
          // ok
        } else {
          console.error(`\n❌ Error en bloque ${i}:`, e.message);
        }
      }
    }
    console.log('\n✅ Esquema aplicado.');

    // 2. Seed Usuarios Básicos
    console.log('🌱 Sembrando usuarios Admin...');

    // Hash de '123456' con salt 10 (generado previamente o hardcodeado para test)
    // $2b$10$Something... Si uso bcrypt en backend, necesito un hash válido.
    // Usaré un hash dummy y confiare en que el test de login falle si no coincide,
    // pero para que funcione necesito un hash real de bcrypt.
    // Hash de '123456': $2b$10$U3w.k/.w/E..x..y..z (ejemplo)
    // Mejor genero uno en tiempo real usando el paquete bcrypt si está instalado, o uno dummy conocido.
    // Dado que no tengo bcrypt a mano en este script simple, usaré una query que asume que el backend
    // compara con bcrypt. Si no tengo el hash, no podré loguearme.

    // Pero espera, el backend usa `npm install bcrypt`. Puedo importarlo.
    // const bcrypt = require('bcrypt'); pero necesito instalar tipos o require.
    // Haré un require simple.

    let hash = '$2b$10$X7V.j/1.k2.3.4.5'; // Hash dummy
    try {
      const bcrypt = require('bcrypt');
      hash = await bcrypt.hash('123456', 10);
    } catch (e) {
      console.log(
        '   (bcrypt no encontrado, usando hash dummy, login fallará si backend chequea strictly)',
      );
    }

    const seedUsers = `
            IF NOT EXISTS (SELECT 1 FROM Inv_seg_roles WHERE nombre = 'ADMIN')
            BEGIN
                INSERT INTO Inv_seg_roles (nombre, descripcion, esSistema, reglas) 
                VALUES ('ADMIN', 'Administrador Total', 1, '["*"]');
            END

            DECLARE @idRolAdmin INT = (SELECT idRol FROM Inv_seg_roles WHERE nombre = 'ADMIN');

            IF NOT EXISTS (SELECT 1 FROM Inv_seg_usuarios WHERE correo = 'diana.martinez@empresa.com')
            BEGIN
                INSERT INTO Inv_seg_usuarios (nombre, correo, carnet, password, idRol, activo, ultimoAcceso)
                VALUES ('Diana Martinez', 'diana.martinez@empresa.com', 'ADM001', '${hash}', @idRolAdmin, 1, GETDATE());
            END
            ELSE
            BEGIN
                UPDATE Inv_seg_usuarios SET password = '${hash}', idRol = @idRolAdmin WHERE correo = 'diana.martinez@empresa.com';
            END
        `;

    await pool.request().query(seedUsers);
    console.log('✅ Usuarios sembrados.');

    pool.close();
  } catch (e) {
    console.error('\nError:', e);
  }
}

main();
