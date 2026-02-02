/**
 * SCRIPT DE PRUEBA DE LOGIN (INVCORE)
 * Instrucciones: Ejecutar con 'node tests/test_login.js'
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const CREDENTIALS = {
    email: 'admin@empresa.com',
    password: 'admin123'
};

async function testLogin() {
    console.log('--- INICIANDO PRUEBA DE LOGIN ---');
    console.log(`Intentando acceso para: ${CREDENTIALS.email}`);

    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, CREDENTIALS);

        if (response.data && response.data.token) {
            console.log('✅ LOGIN EXITOSO');
            console.log('Token recibido:', response.data.token.substring(0, 20) + '...');
            console.log('Datos del usuario:', response.data.user.nombre);
            return response.data.token;
        } else {
            console.error('❌ LOGIN FALLIDO: Respuesta sin token esperado');
            console.log('Respuesta:', response.data);
        }
    } catch (error) {
        console.error('❌ ERROR OPERATIVO:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testLogin();
