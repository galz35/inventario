
const axios = require('axios');
const fs = require('fs');

// --- CONFIG ---
const API_URL = 'http://localhost:3000/api';
// Using 'correo' as per previous correction
const SUPERVISOR_CREDS = { correo: 'sofia.lopez@empresa.com', password: '123456' };
const BODEGUERO_CREDS = { correo: 'roberto.central@empresa.com', password: '123456' };
const TECNICO_CREDS = { correo: 'carlos.paredes@empresa.com', password: '123456' };

const PRODUCT_CABLE_CODE = 'CBL-FIB-1H';
const PRODUCT_SPLITTER_CODE = 'SPL-1-8';

// --- UTILS ---
let tokens = {}; // Map user email -> Access Token

async function login(userCreds, roleName) {
    try {
        console.log(`\n🔑 [LOGIN] ${roleName} (${userCreds.correo})...`);
        const res = await axios.post(`${API_URL}/auth/login`, userCreds);
        // Ajuste: si el backend retorna la data sin anidar en 'data', usar res.data direct
        // auth.controller retorna directo el resultado de authService.login, que es { access_token, user: ... }
        // axios wrappea todo en 'data'.
        const payload = res.data;

        if (!payload.access_token) {
            console.log('Payload keys:', Object.keys(payload));
            if (payload.data && payload.data.access_token) {
                // Fallback if wrapped in data
                const token = payload.data.access_token;
                tokens[userCreds.correo] = token;
                const userData = payload.data.user;
                console.log(`   ✅ Success (wrapped). UserID: ${userData.idUsuario}`);
                return userData;
            }
            throw new Error('No access_token received in login response');
        }

        const token = payload.access_token;

        tokens[userCreds.correo] = token; // Store token with email as key

        const userData = payload.user;
        console.log(`   ✅ Success. UserID: ${userData.idUsuario}`);
        return userData;
    } catch (e) {
        console.error(`   ❌ Failed: ${e.message}`);
        if (e.response) {
            console.error('Status:', e.response.status);
            console.error('Data:', JSON.stringify(e.response.data));
        }
        throw e;
    }
}

async function getAuthHeader(email) {
    const token = tokens[email];
    if (!token) throw new Error(`Token not found for ${email}`);
    return { headers: { Authorization: `Bearer ${token}` } };
}

// --- FLOW STEPS ---

async function runScenario() {
    try {
        console.log("🎬 INICIANDO ESCENARIO: 'Flujo Completo de OT con Consumo Realista' 🎬");

        // 1. Login Everyone
        const supervisor = await login(SUPERVISOR_CREDS, 'SUPERVISOR');
        const bodeguero = await login(BODEGUERO_CREDS, 'BODEGUERO');
        const tecnico = await login(TECNICO_CREDS, 'TECNICO');

        // 2. Bodeguero transfers Stock to Technician (Pre-requisite)
        console.log(`\n🚚 [TRANSFER] Bodega Central -> Técnico Carlos`);
        // We need IDs for warehouses and products. 
        // Let's assume fetching catalog or harcode IDs if we verified them. 
        // Based on 'clean_and_populate_real_data.sql', Bodega Central is unlikely ID 1, let's fetch.

        const superHeader = await getAuthHeader(supervisor.correo);

        // Fetch Almacenes
        const resAlm = await axios.get(`${API_URL}/inv/catalogos/almacenes`, superHeader);
        const almacenes = resAlm.data.data || resAlm.data;
        const almCentral = almacenes.find(a => a.tipo === 'BODEGA_CENTRAL' || a.nombre.toLowerCase().includes('central'));

        // We need an warehouse for the technician. If it doesn't exist, Create it?
        // Or transfer to 'Personal' stock? 
        // Assuming current system supports 'Almacen Tecnico' assigned to user.
        // Let's check if tecnico has 'idAlmacenTecnico'.
        let almTecnicoId = tecnico.idAlmacenTecnico;

        if (!almTecnicoId) {
            console.log("   ⚠️ Técnico no tiene almacén asignado. Creando almacén móvil temporal...");
            // This step might fail if API doesn't allow creating warehouse easily, but let's try or assume ID
            // If this fails, we consume from Central directly for this demo, 
            // BUT user wants "que almacen ocupo", suggesting strict tracking.
            // Let's create one using Supervisor
            const newAlmRes = await axios.post(`${API_URL}/inv/catalogos/almacenes`, {
                nombre: `Móvil - ${tecnico.nombre}`,
                tipo: 'MOVIL',
                ubicacion: 'Unidad T-04',
                idResponsable: tecnico.idUsuario // Linking to tech
            }, superHeader);
            almTecnicoId = newAlmRes.data.data ? newAlmRes.data.data.idAlmacen : newAlmRes.data.idAlmacen;
            console.log(`   ✅ Almacén Móvil creado: ID ${almTecnicoId}`);
        } else {
            console.log(`   ℹ️ Técnico tiene almacén ID ${almTecnicoId}`);
        }

        // Fetch Products IDs
        const resProd = await axios.get(`${API_URL}/inv/catalogos/productos?buscar=${PRODUCT_CABLE_CODE}`, superHeader);
        const prodCable = (resProd.data.data || resProd.data)[0];

        const resProd2 = await axios.get(`${API_URL}/inv/catalogos/productos?buscar=${PRODUCT_SPLITTER_CODE}`, superHeader);
        const prodSplitter = (resProd2.data.data || resProd2.data)[0];

        if (!prodCable || !prodSplitter) throw new Error('Productos no encontrados para el escenario');

        // Execute Transfer
        const bodegaHeader = await getAuthHeader(bodeguero.correo);
        const transferPayload = {
            idAlmacenOrigen: almCentral.idAlmacen,
            idAlmacenDestino: almTecnicoId,
            notas: 'Reabastecimiento para Proyecto Norte',
            items: [
                { productoId: prodCable.idProducto, cantidad: 500 }, // 500m
                { productoId: prodSplitter.idProducto, cantidad: 10 } // 10 units
            ]
        };

        const resTrans = await axios.post(`${API_URL}/inv/inventario/transferencia/enviar`, transferPayload, bodegaHeader);
        const idTrans = resTrans.data.data ? resTrans.data.data.idTransferencia : resTrans.data.idTransferencia;
        console.log(`   ✅ Transferencia #${idTrans} Enviada. Auto-confirmando para agilizar...`);

        // Auto confirm (usually tech does this, let's login tech)
        const techHeader = await getAuthHeader(tecnico.correo);
        await axios.post(`${API_URL}/inv/inventario/transferencia/confirmar`, { idTransferencia: idTrans }, techHeader);
        console.log(`   ✅ Transferencia Confirmada. Técnico tiene stock.`);


        // 3. Supervisor creates OT
        console.log(`\n📋 [OT] Supervisor Crea Orden de Trabajo`);
        const otPayload = {
            cliente: 'Residencial Los Álamos - Casa #44',
            direccion: 'Av. Las Torres 123',
            tipo: 'INSTALACION', // INSTALACION | MANTENIMIENTO
            prioridad: 'ALTA',
            notas: 'Cliente VIP. Requiere instalación FTTH completa.',
            idTecnicoAsignado: tecnico.idUsuario,
            fechaProgramada: new Date().toISOString()
        };

        const resOT = await axios.post(`${API_URL}/inv/operaciones/ot`, otPayload, superHeader);
        const idOT = resOT.data.data ? resOT.data.data.idOT : resOT.data.idOT;
        console.log(`   ✅ OT #${idOT} Creada y Asignada a Carlos.`);


        // 4. Technician Consumes Material for OT
        console.log(`\n🛠️ [WORK] Técnico registra consumo en OT #${idOT}`);

        const consumoPayload = {
            productoId: prodCable.idProducto,
            cantidad: 80, // Used 80m
            idAlmacenOrigen: almTecnicoId // Consuming from his mobile stock
        };

        await axios.post(`${API_URL}/inv/operaciones/ot/${idOT}/consumo`, consumoPayload, techHeader);
        console.log(`   ✅ Consumo registrado: 80m Cable.`);

        const consumoPayload2 = {
            productoId: prodSplitter.idProducto,
            cantidad: 1,
            idAlmacenOrigen: almTecnicoId
        };

        await axios.post(`${API_URL}/inv/operaciones/ot/${idOT}/consumo`, consumoPayload2, techHeader);
        console.log(`   ✅ Consumo registrado: 1 Splitter.`);


        // 5. Technician Closes the OT
        console.log(`\n✅ [CLOSE] Técnico finaliza la OT`);
        await axios.post(`${API_URL}/inv/operaciones/ot/${idOT}/cerrar`, { notas: 'Instalación exitosa. Potencia -18dBm.' }, techHeader);
        console.log(`   ✅ OT Cerrada.`);

        console.log("\n🎉 ESCENARIO COMPLETADO CORRECTAMENTE. Verificar Frontend.");

    } catch (e) {
        console.error("\n💥 Error crítico en el escenario:", e.response ? JSON.stringify(e.response.data) : e.message);
    }
}

runScenario();
