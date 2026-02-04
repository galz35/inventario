import axios from 'axios';

// Base Configuration
// Global prefix 'api' is set in main.ts, so we include it here.
// Base Configuration
// Global prefix 'api' is set in main.ts, so we include it here.
// Use relative path in production or environment variable if set
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3000/api');

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor for Auth Token
api.interceptors.request.use(config => {
    const token = localStorage.getItem('inv_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

// Interceptor for Response Errors (Global 401 Handling)
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {
            console.warn('[API] Session expired or unauthorized. Redirecting to login.');
            localStorage.removeItem('inv_token');
            localStorage.removeItem('inv_user');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

// Auth Service
class AuthService {
    async login(correo: string, password: string) {
        // Authenticator controller check: User indicates InvAuthController at /inv/auth/login
        return api.post('/inv/auth/login', { correo, password });
    }

    async getUsers() {
        return api.get('/inv/auth/usuarios');
    }

    async toggleUserStatus(id: number, activo: boolean) {
        return api.patch(`/inv/auth/usuarios/${id}/estado`, { activo });
    }

    async createUser(data: any) {
        return api.post('/inv/auth/usuarios', data);
    }

    logout() {
        localStorage.removeItem('inv_token');
        localStorage.removeItem('inv_user');
        window.location.href = '/';
    }
}

// Inventory Service
class InventoryService {
    // Dashboard
    async getDashboardMetrics() {
        return api.get('/inv/reportes/dashboard');
    }

    // Reports
    async getReporteSLA() {
        return api.get('/inv/reportes/sla');
    }

    async getReporteConsumoProyecto() {
        return api.get('/inv/reportes/consumo-proyecto');
    }

    async getReporteStockBajo() {
        return api.get('/inv/reportes/stock-bajo');
    }

    // Stock
    async getStock(params?: any) {
        return api.get('/inv/inventario/stock', { params });
    }

    async getConsignedStock() {
        return api.get('/inv/inventario/stock/consignacion');
    }

    async getKardex(almacenId: number, productoId: number) {
        return api.get('/inv/inventario/kardex', { params: { almacenId, productoId } });
    }

    // Actions
    async notificarStockBajo() {
        return api.post('/inv/reportes/notificar-stock-bajo');
    }

    async importarStock(data: { base64: string, almacenId: number, extension: string }) {
        return api.post('/inv/inventario/importar', data);
    }

    async enviarTransferencia(data: any) {
        return api.post('/inv/inventario/transferencia/enviar', data);
    }

    async confirmarTransferencia(id: number) {
        return api.post('/inv/inventario/transferencia/confirmar', { idTransferencia: id });
    }

    async getTransferencias(params?: any) {
        return api.get('/inv/inventario/transferencias', { params });
    }

    async getTransferenciaDetalles(id: number) {
        return api.get(`/inv/inventario/transferencias/${id}/detalles`);
    }

    // Catalogs & Assets
    async getAlmacenes() {
        try {
            return await api.get('/inv/catalogos/almacenes');
        } catch (e) {
            console.warn('Endpoint /inv/catalogos/almacenes might be missing or error', e);
            return { data: [] };
        }
    }

    async getCatalog(type: string) {
        // type: 'productos', 'proveedores', 'categorias'
        return api.get(`/inv/catalogos/${type}`);
    }

    async saveCatalog(type: string, data: any) {
        return api.post(`/inv/catalogos/${type}`, data);
    }

    async getHistoriaProducto(productoId: number, almacenId?: number) {
        return api.get('/inv/inventario/historia', { params: { productoId, almacenId } });
    }



    async getHistorialActivo(id: number) {
        return api.get(`/inv/activos/${id}/historial`);
    }

    async crearActivo(data: any) {
        return api.post('/inv/activos', data);
    }

    async asignarActivo(data: any) {
        return api.post('/inv/activos/asignar', data);
    }

    async deleteActivo(id: number) {
        return api.delete(`/inv/activos/${id}`);
    }

    async getConteos() {
        return api.get('/inv/auditoria/conteos');
    }

    async iniciarAuditoria(data: any) {
        return api.post('/inv/auditoria/iniciar', data);
    }

    async conciliarAuditoria(data: any) {
        return api.post('/inv/auditoria/conciliar', data);
    }

    async getCierresMensuales() {
        return api.get('/inv/auditoria/cierres');
    }

    async generarCierreMensual(data: any) {
        return api.post('/inv/auditoria/cierre-mensual', data);
    }

    async registrarMovimiento(data: any) {
        return api.post('/inv/inventario/movimiento', data);
    }

    async getLiquidations() {
        return api.get('/inv/consignacion/liquidaciones');
    }

    async calculateLiquidation(proveedorId: number, start: Date, end: Date) {
        return api.get('/inv/consignacion/calcular', {
            params: {
                proveedorId,
                fechaInicio: start.toISOString(),
                fechaFin: end.toISOString()
            }
        });
    }

    async processLiquidation(data: any) {
        return api.post('/inv/consignacion/procesar', data);
    }

    async getTecnicoConsumoDiario(fecha: string) {
        return api.get('/inv/reportes/consumo-tecnico-diario', { params: { fecha } });
    }

    async getProveedorResumen(id: number) {
        return api.get(`/inv/consignacion/proveedor/${id}/resumen`);
    }
}

// Operations Service (OTs)
class OperationsService {
    async listarOTs(params?: any) {
        return api.get('/inv/operaciones/ot', { params });
    }

    async crearOT(data: any) {
        return api.post('/inv/operaciones/ot', data);
    }

    async cerrarOT(id: number, notas: string) {
        return api.post(`/inv/operaciones/ot/${id}/cerrar`, { notas });
    }

    async registrarConsumo(id: number, item: { productoId: number, cantidad: number }) {
        return api.post(`/inv/operaciones/ot/${id}/consumo`, item);
    }

    async subirEvidencia(id: number, base64: string, tipo: string) {
        return api.post(`/inv/operaciones/ot/${id}/evidencia`, { base64, tipo });
    }

    async asignarOT(idOT: number, idTecnico: number) {
        return api.post(`/inv/operaciones/ot/${idOT}/asignar`, { idTecnico });
    }

    async actualizarOT(idOT: number, data: any) {
        return api.post(`/inv/operaciones/ot/${idOT}/actualizar`, data);
    }

    async getHistorialOT(idOT: number) {
        return api.get(`/inv/operaciones/ot/${idOT}/historial`);
    }

    async getEvidencias(idOT: number) {
        return api.get(`/inv/operaciones/ot/${idOT}/evidencias`);
    }
}

// Planning Service (Tasks)
class PlanningService {
    async getProyectos() {
        return api.get('/inv/planificacion/proyectos');
    }

    async getWBS(idProyecto: number) {
        return api.get(`/inv/planificacion/proyectos/${idProyecto}/wbs`);
    }

    async getHistorial(idProyecto: number) {
        return api.get(`/inv/planificacion/proyectos/${idProyecto}/historial`);
    }

    async crearTarea(dto: any) {
        return api.post('/inv/planificacion/tarea', dto);
    }

    async updateTarea(id: number, dto: any) {
        return api.post(`/inv/planificacion/tarea/${id}`, dto);
    }

    async estimarMaterial(dto: any) {
        return api.post('/inv/planificacion/material-estimado', dto);
    }

    // New Project Management
    async createProyecto(dto: any) {
        return api.post('/inv/planificacion/proyectos', dto);
    }

    async updateProyecto(id: number, dto: any) {
        return api.post(`/inv/planificacion/proyectos/${id}`, dto);
    }

    async deleteProyecto(id: number) {
        return api.delete(`/inv/planificacion/proyectos/${id}`);
    }

    async assignUserToTask(dto: { idTarea: number, idUsuario: number, rol: string }) {
        return api.post(`/inv/planificacion/tarea/${dto.idTarea}/asignar`, dto);
    }

    async getTaskResources(idTarea: number) {
        return api.get(`/inv/planificacion/tarea/${idTarea}/recursos`);
    }
}

// Vehicles Service
class VehiculosService {
    async getVehiculos() {
        return api.get('/inv/vehiculos');
    }

    async upsertVehiculo(data: any) {
        return api.post('/inv/vehiculos', data);
    }

    async getLogs(idVehiculo?: number) {
        return api.get('/inv/vehiculos/logs', { params: { idVehiculo } });
    }

    async registrarLog(data: any) {
        return api.post('/inv/vehiculos/log', data);
    }
}

// Assets Service
class ActivosService {
    async buscarActivo(serial: string) {
        return api.get(`/inv/activos/buscar?serial=${serial}`);
    }

    async getActivos(params?: { q?: string, estado?: string }) {
        return api.get('/inv/activos', { params });
    }

    async crearActivo(data: any) {
        return api.post('/inv/activos', data);
    }
}

export const authService = new AuthService();
export const invService = new InventoryService();
export const opeService = new OperationsService();
export const planService = new PlanningService();
export const vehService = new VehiculosService();
export const activosService = new ActivosService();
