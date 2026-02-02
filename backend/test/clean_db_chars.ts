import { connect } from 'mssql';

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
    console.log('✅ Conectado a DB para limpieza de caracteres especiales');

    const updates = [
      // Limpieza de caracteres mal codificados (Ã³, etc) y acentos
      "UPDATE Inv_cat_tipos_ot SET nombre = REPLACE(REPLACE(nombre, 'Ó', 'O'), 'ó', 'o')",
      "UPDATE Inv_cat_tipos_ot SET nombre = REPLACE(nombre, 'á', 'a')",
      "UPDATE Inv_cat_tipos_ot SET nombre = REPLACE(nombre, 'Ã³', 'o')", // Caso reportado DotaciÃ³n
      "UPDATE Inv_inv_movimientos SET referenciaTexto = REPLACE(REPLACE(referenciaTexto, 'Ã³', 'o'), 'ó', 'o')",
      "UPDATE Inv_inv_movimientos SET notas = REPLACE(REPLACE(notas, 'Ã³', 'o'), 'ó', 'o')",

      // Reemplazo general de acentos y ñ en tablas principales
      "UPDATE Inv_cat_categorias_producto SET nombre = 'Categorias' WHERE nombre LIKE 'Categor%as%'",
      "UPDATE Inv_cat_categorias_producto SET descripcion = REPLACE(REPLACE(REPLACE(descripcion, 'í', 'i'), 'ó', 'o'), 'á', 'a')",
      "UPDATE Inv_cat_tipos_ot SET nombre = 'Instalacion Basica' WHERE nombre LIKE 'Instalaci%n B%sica'",
      "UPDATE Inv_ope_proyectos SET nombre = REPLACE(nombre, 'ó', 'o'), descripcion = REPLACE(REPLACE(descripcion, 'automatica', 'automatica'), 'ó', 'o')",

      // Búsqueda y reemplazo agresivo de caracteres comunes
      "UPDATE Inv_cat_tipos_ot SET nombre = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(nombre, 'á', 'a'), 'é', 'e'), 'í', 'i'), 'ó', 'o'), 'ú', 'u')",
      "UPDATE Inv_cat_productos SET nombre = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(nombre, 'á', 'a'), 'é', 'e'), 'í', 'i'), 'ó', 'o'), 'ú', 'u')",
      "UPDATE Inv_seg_roles SET nombre = 'Tecnico' WHERE nombre LIKE 'T%cnico'",
      "UPDATE Inv_seg_roles SET descripcion = REPLACE(descripcion, 'Gestion', 'Gestion') WHERE descripcion LIKE '%Gesti%n%'",
    ];

    for (const sql of updates) {
      try {
        await pool.request().query(sql);
      } catch (err) {
        console.warn(`Error en query: ${sql}`, err.message);
      }
    }

    // Caso específico Dotacion
    await pool
      .request()
      .query(
        "UPDATE Inv_inv_movimientos SET referenciaTexto = 'Dotacion Inicial Carlos' WHERE referenciaTexto LIKE 'Dotaci%n%'",
      );
    await pool
      .request()
      .query(
        "UPDATE Inv_cat_tipos_ot SET nombre = 'Dotacion' WHERE nombre LIKE 'Dotaci%n%'",
      );

    console.log('✅ Limpieza de Base de Datos completada.');
    await pool.close();
  } catch (e) {
    console.error('Error al conectar:', e.message);
  }
}

main();
