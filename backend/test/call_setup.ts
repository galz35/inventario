import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

async function main() {
  console.log('🛠️ Calling Setup DB...');
  try {
    const res = await axios.get(`${API_URL}/setup-db`, { timeout: 120000 }); // 2 min timeout
    console.log('Status:', res.status);
    console.log('Data:', JSON.stringify(res.data, null, 2));
  } catch (e: any) {
    console.error('❌ Error Setup:', e.message);
    if (e.response) {
      console.error('Status:', e.response.status);
      console.error('Data:', JSON.stringify(e.response.data, null, 2));
    }
  }
}

main();
