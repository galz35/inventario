import { useState, useEffect, useMemo } from 'react';
import { activosService, invService } from '../../services/api.service';
import { Search, User, Box, History, Filter, Plus, ShieldCheck } from 'lucide-react';
import { SidePanel } from '../../components/SidePanel';
import { KardexTimeline } from '../inventario/components/KardexTimeline';
import { Modal } from '../../components/Modal';
import { alertSuccess, alertError } from '../../services/alert.service';

export const ActivosView = () => {
    // View Mode: 'list' or 'track' (legacy tracker) - We'll stick to list as default per request
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('');

    // Data List
    const [activos, setActivos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // User & Filters
    const [user, setUser] = useState<any>(null);
    const [showMyAssets, setShowMyAssets] = useState(false);

    // Details / History
    const [selectedActivo, setSelectedActivo] = useState<any>(null);
    const [showHistory, setShowHistory] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [historyData, setHistoryData] = useState<any[]>([]);

    // Creation State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newItem, setNewItem] = useState({
        serial: '',
        idProducto: '',
        modelo: '',
        estado: 'DISPONIBLE',
        idAlmacenActual: ''
    });
    const [productos, setProductos] = useState<any[]>([]);
    const [almacenes, setAlmacenes] = useState<any[]>([]);

    useEffect(() => {
        const u = localStorage.getItem('inv_user');
        if (u) {
            const parsed = JSON.parse(u);
            setUser(parsed);
            if (parsed.rolNombre?.toUpperCase().includes('TECNICO')) {
                setShowMyAssets(true);
            }
        }
    }, []);

    // Debounce search effect or direct dependency
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchActivos();
        }, 300); // 300ms debounce
        return () => clearTimeout(timer);
    }, [busqueda, filtroEstado]);

    useEffect(() => {
        fetchMasters();
    }, []);

    const fetchMasters = async () => {
        try {
            const [p, a] = await Promise.all([
                invService.getCatalog('productos'),
                invService.getAlmacenes()
            ]);
            // Safe access to data structure
            setProductos(p.data?.data || p.data || []);
            setAlmacenes(a.data?.data || a.data || []);
        } catch (e) {
            console.error('Error fetching masters', e);
        }
    };

    const fetchActivos = async () => {
        setLoading(true);
        try {
            const res = await activosService.getActivos({ q: busqueda, estado: filtroEstado });
            setActivos(res.data?.data || res.data || []);
        } catch (err) {
            console.error(err);
            setActivos([]); // Clear on error
        } finally {
            setLoading(false);
        }
    };

    const displayActivos = useMemo(() => {
        if (!showMyAssets) return activos;
        return activos.filter(a => {
            // Match by name or ID if available. 
            // Currently using string match for demo robustness if IDs are missing in view model
            const assignedName = a.tecnicoResponsable || a.clienteAsignado || '';
            const userName = user?.nombre || '';

            // Check ID first if available, then name
            const matchesId = a.idResponsable && user?.idUsuario && a.idResponsable === user.idUsuario;
            const matchesName = assignedName.toLowerCase().includes(userName.toLowerCase());

            return matchesId || matchesName;
        });
    }, [activos, showMyAssets, user]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchActivos();
    };

    const handleCreate = async () => {
        if (!newItem.serial || !newItem.idProducto) return alertError('Serial y Producto requeridos');
        try {
            await activosService.crearActivo({
                ...newItem,
                idProducto: parseInt(newItem.idProducto),
                idAlmacenActual: newItem.idAlmacenActual ? parseInt(newItem.idAlmacenActual) : 1
            });
            alertSuccess('Activo creado correctamente');
            setShowCreateModal(false);
            setNewItem({ serial: '', idProducto: '', modelo: '', estado: 'DISPONIBLE', idAlmacenActual: '' });
            fetchActivos();
        } catch (err: any) {
            alertError('Error al crear', err.response?.data?.message || err.message);
        }
    };

    const handleViewHistory = async (activo: any) => {
        setSelectedActivo(activo);
        setShowHistory(true);
        setLoadingHistory(true);
        setHistoryData([]);

        try {
            // Improved: Try to fetch history specifically for this asset serial if possible
            // If the API supports getHistoriaActivo(idActivo), use it. 
            // Otherwise fallback to product history but maybe filtering in frontend?
            // Assuming we stick to product history if serial history endpoint doesn't exist yet.

            // Note: If you have an endpoint for specific asset history, use it here.
            // For now, we will fetch product history as a fallback but log intent.
            const resProd = await invService.getHistoriaProducto(activo.idProducto || activo.productoId);
            setHistoryData(resProd.data?.data || resProd.data || []);

        } catch (err) {
            console.error("Error fetching history", err);
        } finally {
            setLoadingHistory(false);
        }
    };

    const getEstadoColor = (estado: string) => {
        switch (estado) {
            case 'DISPONIBLE': return '#10b981';
            case 'ASIGNADO': return '#f59e0b';
            case 'MANTENIMIENTO': return '#ef4444';
            case 'BAJA': return '#64748b';
            default: return '#94a3b8';
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 5px 0', color: '#f8fafc' }}>
                        Inventario de Activos
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '1rem', margin: 0 }}>Gestión y trazabilidad de equipos por serie</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                        <Plus size={18} style={{ marginRight: '8px' }} /> Nuevo Activo
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div style={{ background: '#1e293b', padding: '15px', borderRadius: '12px', display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                <form onSubmit={handleSearchSubmit} style={{ flex: 1, display: 'flex', gap: '10px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
                        <input
                            className="form-input"
                            placeholder="Buscar por Serie, Modelo o Nombre..."
                            value={busqueda}
                            onChange={e => setBusqueda(e.target.value)}
                            style={{ paddingLeft: '38px' }}
                        />
                    </div>
                </form>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                        className={`btn-secondary ${showMyAssets ? 'active' : ''}`}
                        style={{ background: showMyAssets ? 'var(--accent)' : '' }}
                        onClick={() => setShowMyAssets(!showMyAssets)}
                    >
                        <ShieldCheck size={18} style={{ marginRight: '5px' }} />
                        {showMyAssets ? 'Mis Activos' : 'Ver Mis Activos'}
                    </button>

                    <div style={{ width: '1px', background: '#334155', height: '30px', margin: '0 5px' }}></div>

                    <Filter size={18} color="#64748b" />
                    <select
                        className="form-input"
                        style={{ width: '180px' }}
                        value={filtroEstado}
                        onChange={e => setFiltroEstado(e.target.value)}
                    >
                        <option value="">Todos los Estados</option>
                        <option value="DISPONIBLE">🟢 Disponibles</option>
                        <option value="ASIGNADO">🟠 Asignados</option>
                        <option value="MANTENIMIENTO">🔴 En Mantenimiento</option>
                        <option value="BAJA">⚫ De Baja</option>
                    </select>
                </div>

                <button className="btn-secondary" onClick={fetchActivos} disabled={loading}>
                    {loading ? '...' : 'Actualizar'}
                </button>
            </div>

            {/* Table */}
            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Serial / ID</th>
                            <th>Producto</th>
                            <th>Ubicación / Responsable</th>
                            <th>Estado</th>
                            <th>Fecha Alta</th>
                            <th style={{ textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>Cargando activos...</td></tr>
                        ) : displayActivos.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No se encontraron activos con los filtros actuales.</td></tr>
                        ) : (
                            displayActivos.map((activo) => (
                                <tr key={activo.idActivo} className="hover-row">
                                    <td>
                                        <div style={{ fontWeight: 700, color: '#f8fafc' }}>{activo.serial}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{activo.productoCodigo}</div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{activo.productoNombre}</div>
                                        {activo.modelo && <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Mod: {activo.modelo}</div>}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {activo.tecnicoResponsable ? (
                                                <><User size={14} color="#3b82f6" /> <span style={{ color: '#e2e8f0' }}>{activo.tecnicoResponsable}</span></>
                                            ) : activo.ubicacionAlmacen ? (
                                                <><Box size={14} color="#10b981" /> <span>{activo.ubicacionAlmacen}</span></>
                                            ) : (
                                                <span style={{ color: '#64748b' }}>--</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge" style={{
                                            background: getEstadoColor(activo.estado) + '20',
                                            color: getEstadoColor(activo.estado),
                                            border: `1px solid ${getEstadoColor(activo.estado)}40`
                                        }}>
                                            {activo.estado}
                                        </span>
                                    </td>
                                    <td style={{ color: '#94a3b8' }}>
                                        {activo.fechaIngreso ? new Date(activo.fechaIngreso).toLocaleDateString() : '-'}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button
                                            className="btn-icon"
                                            title="Ver Historial"
                                            onClick={() => handleViewHistory(activo)}
                                        >
                                            <History size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* History Panel */}
            <SidePanel
                isOpen={showHistory}
                onClose={() => setShowHistory(false)}
                title="Detalle del Activo"
                width="600px"
            >
                {selectedActivo && (
                    <div style={{ padding: '0 5px' }}>
                        <div className="card" style={{ marginBottom: '20px', background: '#0f172a', border: '1px solid #334155' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{selectedActivo.productoNombre}</h3>
                                    <div style={{ color: '#94a3b8', fontFamily: 'monospace', marginTop: '4px' }}>SN: {selectedActivo.serial}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ color: getEstadoColor(selectedActivo.estado), fontWeight: 700 }}>{selectedActivo.estado}</span>
                                </div>
                            </div>
                            <div style={{ marginTop: '15px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <InfoRow label="Ubicación" value={selectedActivo.ubicacionAlmacen} />
                                <InfoRow label="Responsable" value={selectedActivo.tecnicoResponsable || selectedActivo.clienteAsignado} />
                                <InfoRow label="Modelo" value={selectedActivo.modelo} />
                                <InfoRow label="Ingreso" value={selectedActivo.fechaIngreso ? new Date(selectedActivo.fechaIngreso).toLocaleDateString() : ''} />
                            </div>
                        </div>

                        <h4 style={{ borderBottom: '1px solid #334155', paddingBottom: '10px', marginBottom: '15px' }}>Historial de Movimientos (Producto)</h4>
                        {loadingHistory ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Cargando historial...</div>
                        ) : (
                            <KardexTimeline movimientos={historyData} />
                        )}
                    </div>
                )}
            </SidePanel>

            <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Alta de Nuevo Activo">
                <div className="form-group">
                    <label>Número de Serie (SN)</label>
                    <input className="form-input" value={newItem.serial} onChange={e => setNewItem({ ...newItem, serial: e.target.value })} placeholder="Ej: SN-29384823" />
                </div>
                <div className="form-group">
                    <label>Producto Base</label>
                    <select className="form-input" value={newItem.idProducto} onChange={e => setNewItem({ ...newItem, idProducto: e.target.value })}>
                        <option value="">-- Seleccionar --</option>
                        {productos.map(p => <option key={p.idProducto} value={p.idProducto}>{p.codigo} - {p.nombre}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label>Modelo / Versión</label>
                    <input className="form-input" value={newItem.modelo} onChange={e => setNewItem({ ...newItem, modelo: e.target.value })} placeholder="Opcional" />
                </div>
                <div className="form-group">
                    <label>Almacén Inicial</label>
                    <select className="form-input" value={newItem.idAlmacenActual} onChange={e => setNewItem({ ...newItem, idAlmacenActual: e.target.value })}>
                        <option value="">-- Bodega Central (Default) --</option>
                        {almacenes.map(a => <option key={a.idAlmacen} value={a.idAlmacen}>{a.nombre}</option>)}
                    </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                    <button className="btn-primary" onClick={handleCreate}>Registrar Alta</button>
                </div>
            </Modal>
        </div>
    );
};

const InfoRow = ({ label, value }: any) => (
    <div>
        <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontWeight: 600 }}>{value || '--'}</div>
    </div>
);
