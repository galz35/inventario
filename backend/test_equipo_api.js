const axios = require('axios');

async function runTest() {
    const baseURL = 'http://localhost:3000/api';
    const credentials = {
        correo: 'gustavo.lira@claro.com.ni',
        password: '123456'
    };

    try {
        console.log('--- Iniciando Prueba de API Equipo/Inform ---');

        // 1. Login
        console.log('1. Intentando login...');
        const loginRes = await axios.post(`${baseURL}/auth/login`, credentials);
        const token = loginRes.data.data.access_token;
        const loggedUser = loginRes.data.data.user; // Corrected path
        console.log(`   ✅ Login exitoso. Carnet en token: ${loggedUser?.carnet}`);
        console.log(`   ✅ ID Usuario: ${loggedUser?.idUsuario}`);

        // 2. Probar equipo/inform
        const fecha = '2026-01-26';
        console.log(`2. Consultando /equipo/inform para fecha: ${fecha}...`);

        const informRes = await axios.get(`${baseURL}/equipo/inform`, {
            params: { fecha },
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('   ✅ Respuesta recibida.');

        const data = informRes.data.data;
        if (!data || !data.miembros) {
            console.log('   ⚠️ No se recibieron miembros en la respuesta.');
            console.log(JSON.stringify(informRes.data, null, 2));
            return;
        }

        console.log(`   👥 Total miembros: ${data.miembros.length}`);

        data.miembros.forEach(m => {
            console.log(`\n   --- Miembro: ${m.usuario.nombre} (${m.usuario.carnet}) ---`);
            console.log(`   📊 Estadísticas:`, m.estadisticas);
        });

    } catch (error) {
        console.error('   ❌ Error en la prueba:');
        if (error.response) {
            console.error('      Status:', error.response.status);
            console.error('      Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('      Mensaje:', error.message);
        }
    }
}

runTest();
