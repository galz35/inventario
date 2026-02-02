import axios from 'axios';
import { sql, connect } from 'mssql';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../../.env') });

const API_URL = 'http://localhost:3000/api';
const USER_EMAIL = 'diana.martinez@empresa.com'; // Admin
const USER_PASS = '123456';

// Config DB para limpieza
const dbConfig = {
  user: process.env.DB_USER || 'plan',
  password: process.env.DB_PASSWORD || 'admin123',
  server: process.env.DB_HOST || '54.146.235.205',
  database: process.env.DB_NAME || 'inventario',
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

// IDs para limpieza
const createdOTs: number[] = [];
const createdTasks: number[] = [];
const createdProjects: number[] = [];
const createdMovements: number[] = [];

async function step(name: string, fn: () => Promise<void>) {
  try {
    console.log(`\n🔹 [STEP] ${name}...`);
    await fn();
    console.log(`✅ [OK] ${name}`);
  } catch (e: any) {
    console.error(`❌ [FAIL] ${name}:`, e.response?.data || e.message);
    throw e;
  }
}

async function main() {
  console.log('🚀 Iniciando Test E2E Completo del Backend...\n');

  let token = '';
  let headers = {};

  await step('Autenticación (Login)', async () => {
    const res = await axios.post(`${API_URL}/auth/login`, {
      correo: USER_EMAIL,
      password: USER_PASS,
    });

    // Ajuste por TransformInterceptor: data -> data.data
    const payload = res.data.data || res.data;

    if (!payload.access_token) throw new Error('No token received');
    token = payload.access_token;
    headers = { Authorization: `Bearer ${token}` };
    console.log('   Token recibido correctamente.');
  });

  // ==========================================
  // 1. INVENTARIO
  // ==========================================
  await step('Inventario: Listar Stock', async () => {
    const res = await axios.get(`${API_URL}/inv/inventario/stock`, { headers });
    if (!Array.isArray(res.data) && !Array.isArray(res.data.data))
      throw new Error('Formato inválido stock');
    console.log(
      `   Items stock encontrados: ${res.data.length || res.data.data.length}`,
    );
  });

  await step('Inventario: Ver Kardex', async () => {
    // Obtenemos el primer producto del stock para probar
    const resStock = await axios.get(`${API_URL}/inv/inventario/stock`, {
      headers,
    });
    const items = resStock.data.data || resStock.data;
    if (items.length > 0) {
      const item = items[0];
      const res = await axios.get(`${API_URL}/inv/inventario/kardex`, {
        headers,
        params: { almacenId: item.almacenId, productoId: item.productoId },
      });
      console.log(`   Kardex OK para producto ${item.productoNombre}`);
    } else {
      console.log('   (Skip) No hay items para probar Kardex');
    }
  });

  // ==========================================
  // 2. PLANIFICACIÓN
  // ==========================================
  let projectId = 0;
  await step('Planificación: Listar Proyectos', async () => {
    const res = await axios.get(`${API_URL}/inv/planificacion/proyectos`, {
      headers,
    });
    const proyectos = res.data.data || res.data;
    if (proyectos.length === 0)
      throw new Error('No hay proyectos para testear');
    projectId = proyectos[0].idProyecto; // Usar el primero
    console.log(`   Usando Proyecto ID: ${projectId} (${proyectos[0].nombre})`);
  });

  await step('Planificación: Crear Tarea WBS', async () => {
    const res = await axios.post(
      `${API_URL}/inv/planificacion/tarea`,
      {
        idProyecto: projectId,
        nombre: 'Tarea Test Automated',
        descripcion: 'Creada por script de prueba',
        fechaInicioPrevista: new Date(),
        fechaFinPrevista: new Date(),
      },
      { headers },
    );

    const idTarea = res.data.idTarea || res.data.data?.idTarea || res.data; // Ajustar según respuesta
    if (idTarea && typeof idTarea !== 'object') {
      createdTasks.push(idTarea);
      console.log(`   Tarea creada ID: ${idTarea}`);
    } else if (idTarea && typeof idTarea === 'object') {
      // Fallback logic if still returning object
      createdTasks.push(idTarea.idTarea);
      console.log(`   Tarea creada ID: ${idTarea.idTarea}`);
    }
  });

  // ==========================================
  // 3. OPERACIONES (OTs)
  // ==========================================
  let otId = 0;
  let clienteId = 0;
  let tipoOtId = 0;

  await step('Catálogos: Clientes y Tipos OT', async () => {
    const resCli = await axios.get(`${API_URL}/inv/catalogos/clientes`, {
      headers,
    });
    const resTip = await axios.get(`${API_URL}/inv/catalogos/tipos-ot`, {
      headers,
    });

    const clientes = resCli.data.data || resCli.data;
    const tipos = resTip.data.data || resTip.data;

    if (clientes.length === 0) throw new Error('No hay clientes');
    if (tipos.length === 0) throw new Error('No hay tipos OT');

    clienteId = clientes[0].idCliente;
    tipoOtId = tipos[0].idTipoOT;
    console.log(`   Usando ClienteID: ${clienteId}, TipoOT: ${tipoOtId}`);
  });

  await step('Operaciones: Crear OT', async () => {
    /*
            SP espera: @idProyecto, @idCliente, @idTipoOT, @prioridad, @direccion, @idUsuarioCrea
        */
    const res = await axios.post(
      `${API_URL}/inv/operaciones/ot`,
      {
        idProyecto: projectId,
        idCliente: clienteId,
        idTipoOT: tipoOtId,
        prioridad: 'ALTA',
        direccion: 'Calle Falsa 123 - Test',
        notas: 'OT de Prueba Automática',
      },
      { headers },
    );

    const payload = res.data.data || res.data;
    otId = payload.idOT || payload;

    if (otId) createdOTs.push(otId);
    console.log(`   OT Creada ID: ${otId}`);
  });

  await step('Operaciones: Listar OTs', async () => {
    const res = await axios.get(`${API_URL}/inv/operaciones/ot`, { headers });
    const ots = res.data.data || res.data;
    const found = ots.find((o: any) => o.idOT === otId);
    if (!found) throw new Error('OT creada no encontrada en listado');
    console.log('   OT encontrada en listado correctamente.');
  });

  // ==========================================
  // 4. REPORTES
  // ==========================================
  await step('Reportes: Dashboard', async () => {
    const res = await axios.get(`${API_URL}/inv/reportes/dashboard`, {
      headers,
    });
    const data = res.data.data || res.data;

    // Data can be array if repo returned array (now fixed), or single obj
    const dashboard = Array.isArray(data) ? data[0] : data;

    if (dashboard.valorInventario === undefined)
      throw new Error('Dashboard incompleto');
    console.log('   Dashboard metrics OK');
  });

  await step('Reportes: SLA', async () => {
    await axios.get(`${API_URL}/inv/reportes/sla`, { headers });
    console.log('   Reporte SLA OK');
  });

  // ==========================================
  // 5. TEARDOWN (LIMPIEZA)
  // ==========================================
  await step('Limpieza de Datos (DB Directa)', async () => {
    const pool = await connect(dbConfig);

    // 1. OTs
    if (createdOTs.length > 0) {
      const ids = createdOTs.join(',');
      try {
        // Try delete dependent tables that might exist or ignore
        try {
          await pool
            .request()
            .query(`DELETE FROM Inv_ope_ot_evidencias WHERE idOT IN (${ids})`);
        } catch {}
        try {
          await pool
            .request()
            .query(`DELETE FROM Inv_ope_ot_consumo WHERE idOT IN (${ids})`);
        } catch {}
        try {
          await pool
            .request()
            .query(`DELETE FROM Inv_ope_ot_active_time WHERE idOT IN (${ids})`);
        } catch {}

        await pool
          .request()
          .query(`DELETE FROM Inv_ope_ot WHERE idOT IN (${ids})`);
        console.log(`   Eliminadas ${createdOTs.length} OTs.`);
      } catch (e: any) {
        console.error('   ❌ Error limpiando OTs:', e.message);
      }
    }

    // 2. Tareas
    if (createdTasks.length > 0) {
      const ids = createdTasks.join(',');
      try {
        await pool
          .request()
          .query(
            `DELETE FROM Inv_ope_proyecto_tareas WHERE idTarea IN (${ids})`,
          );
        console.log(`   Eliminadas ${createdTasks.length} Tareas.`);
      } catch (e: any) {
        console.error('   ❌ Error limpiando Tareas:', e.message);
      }
    }

    await pool.close();
  });

  console.log('\n✅✅ TEST COMPLETADO EXITOSAMENTE ✅✅');
  process.exit(0);
}

main().catch((err) => {
  console.error('\n🔴 TEST FALLÓ FATALMENTE');
  console.error(err);
  process.exit(1);
});
