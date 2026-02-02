
const axios = require('axios');

async function testLogin(email, password) {
    try {
        console.log(`Intentando login con: ${email} ...`);
        // NOTA: El DTO backend espera 'correo', no 'email'. Si el frontend manda 'email', fallará la validación.
        // Pero el test que hice mandaba 'email', si el DTO tiene @IsString() correo: string, el class-validator rechazará 'email'
        // si tengo whitelist: true.
        const response = await axios.post('http://localhost:3000/api/auth/login', {
            correo: email, // CAMBIO CRÍTICO: 'correo' en lugar de 'email' para matchear DTO
            password: password
        });
        console.log(`Login SUCCESS for ${email}:`, response.data.user ? 'User Data OK' : 'No User Data');
    } catch (error) {
        // console.error(error);
        console.error(`Login FAILED for ${email}:`, error.response ? JSON.stringify(error.response.data) : error.message);
    }
}

async function runTests() {
    console.log("Testing logins CORRECTED DTO FIELD...");
    await testLogin('diana.martinez@empresa.com', '123456');
    await testLogin('mario.estrada@empresa.com', '123456');
    await testLogin('carlos.paredes@empresa.com', '123456');
}

runTests();
