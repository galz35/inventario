import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

async function main() {
  console.log('⏳ Esperando que el backend recargue...');
  await new Promise((r) => setTimeout(r, 5000));

  console.log('🛠️ Iniciando Setup de Base de Datos...');
  try {
    const res = await axios.get(`${API_URL}/setup-db`);
    console.log('Setup Resultado:', res.data);
    if (res.data.error) throw new Error(res.data.error);
  } catch (e: any) {
    console.error('❌ Error Setup:', e.message);
    if (e.response) console.error(e.response.data);
    process.exit(1);
  }

  console.log('\n🚀 Ejecutando Test Completo...');
  // Ejecutar full_api_test.ts como subproceso para aislar
  const { execSync } = require('child_process');
  try {
    // Usamos ts-node directamente
    const output = execSync('npx ts-node test/full_api_test.ts', {
      cwd: process.cwd(),
      encoding: 'utf8',
    });
    console.log(output);
  } catch (e: any) {
    console.error('❌ Test falló:');
    console.error(e.stdout);
    console.error(e.stderr);
    process.exit(1);
  }
}

main();
