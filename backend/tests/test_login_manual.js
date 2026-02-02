
const axios = require('axios');

async function testLogin(email, password) {
    try {
        const response = await axios.post('http://localhost:3000/api/auth/login', {
            email: email,
            password: password
        });
        console.log(`Login SUCCESS for ${email}:`, response.data);
    } catch (error) {
        console.error(`Login FAILED for ${email}:`, error.response ? error.response.data : error.message);
    }
}

async function runTests() {
    console.log("Testing logins...");
    await testLogin('diana.martinez@empresa.com', '123456');
    await testLogin('mario.estrada@empresa.com', '123456');
    await testLogin('carlos.paredes@empresa.com', '123456');
}

runTests();
