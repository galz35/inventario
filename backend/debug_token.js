
const axios = require('axios');

async function checkToken() {
    try {
        const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
            correo: 'gustavo.lira@claro.com.ni',
            password: '123456'
        });
        const user = loginRes.data.data.user;
        const token = loginRes.data.data.access_token;
        console.log('User object from login:', JSON.stringify(user, null, 2));

        // Decode token (simplest way without library)
        const parts = token.split('.');
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        console.log('Token Payload:', JSON.stringify(payload, null, 2));
    } catch (e) {
        console.error('Login failed:', e.message);
    }
}

checkToken();
