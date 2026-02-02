/**
 * SCRIPT DE PRUEBA DE ENDPOINTS (INVCORE)
 * Instrucciones: Ejecutar con 'node tests/test_endpoints.js'
 * Requisito: El backend debe estar corriendo.
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let token = '';

async function runTests() {
    console.log('--- INICIANDO PRUEBA DE ENDPOINTS ---');

    try {
        // 1. Obtener Token (Login)
        console.log('\n[1/5] Autenticando...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@empresa.com',
            password: 'admin123'
        });
        token = loginRes.data.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        console.log('✅ Autorización obtenida');

        // 2. Probar Inventario
        console.log('\n[2/5] Probando GET /inv/inventario/stock...');
        const stockRes = await axios.get(`${BASE_URL}/inv/inventario/stock`, config);
        console.log(`✅ Registros encontrados: ${stockRes.data.length || stockRes.data.data.length}`);

        // 3. Probar Operaciones (Proyectos)
        console.log('\n[3/5] Probando GET /inv/operaciones/proyectos...');
        const proyRes = await axios.get(`${BASE_URL}/inv/operaciones/proyectos`, config);
        console.log(`✅ Proyectos encontrados: ${proyRes.data.length || proyRes.data.data.length}`);

        // 4. Probar Reportes (Stock Bajo)
        console.log('\n[4/5] Probando GET /inv/reportes/stock-bajo...');
        const lowRes = await axios.get(`${BASE_URL}/inv/reportes/stock-bajo`, config);
        console.log(`✅ Items en alerta: ${lowRes.data.length || lowRes.data.data.length}`);

        // 5. Probar Catálogos (Almacenes)
        console.log('\n[5/5] Probando GET /inv/catalogos/almacenes...');
        const almRes = await axios.get(`${BASE_URL}/inv/catalogos/almacenes`, config);
        console.log(`✅ Almacenes configurados: ${almRes.data.length || almRes.data.data.length}`);

        console.log('\n--- ✅ TODAS LAS PRUEBAS DE ENDPOINT EXITOSAS ---');
    } catch (error) {
        console.error('\n❌ FALLO EN LA PRUEBA');
        console.error('Mensaje:', error.message);
        if (error.response) {
            console.error('Endpoint:', error.config.url);
            console.error('Status:', error.response.status);
            console.error('Error Data:', error.response.data);
        }
    }
}

runTests();
