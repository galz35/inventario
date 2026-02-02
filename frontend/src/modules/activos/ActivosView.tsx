import { useState, useEffect } from 'react';
import { invService } from '../../services/api.service';
import { DataTable } from '../../components/DataTable';
import { alertSuccess, alertError } from '../../services/alert.service';
import { Modal } from '../../components/Modal';

export const ActivosView = () => {
    const [activos, setActivos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedActivo, setSelectedActivo] = useState<any>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [historial, setHistorial] = useState<any[]>([]);
    const [loadingHistorial, setLoadingHistorial] = useState(false);
    const [activeTab, setActiveTab] = useState('detalle');
    const [user, setUser] = useState<any>(null);

    // Form States
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [productos, setProductos] = useState<any[]>([]);
    const [almacenes, setAlmacenes] = useState<any[]>([]);
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [formAlta, setFormAlta] = useState({ serial: '', idProducto: '', idAlmacen: '', estado: 'ALMACEN' });
    const [formAsignar, setFormAsignar] = useState({ idActivo: null, idTecnico: '', notas: '' });
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const u = localStorage.getItem('inv_user');
        if (u) {
            const parsed = JSON.parse(u);
            setUser(parsed);
            fetchActivos(parsed);
        }
        fetchCatalogs();
    }, []);

    const isAdmin = user?.rolNombre === 'ADMIN' || user?.rolNombre === 'Administrador' || user?.rolNombre === 'Admin';
    const isTecnico = user?.rolNombre === 'Tecnico' || user?.rolNombre === 'TECNICO';

    const fetchCatalogs = async () => {
        try {
            const [resP, resA] = await Promise.all([
                invService.getCatalog('productos'),
                invService.getAlmacenes()
            ]);
            setProductos(resP.data.data || resP.data || []);
            setAlmacenes(resA.data.data || resA.data || []);

            // Fetch users for assignment (Assuming Admin can list)
            try {
                // We need to add this method or use a generic one
                const resU = await invService.getCatalog('usuarios'); // Simplified for now
                setUsuarios(resU.data.data || resU.data || []);
            } catch (e) { console.warn('Could not fetch users', e); }
        } catch (err) {
            console.error('Error fetching catalogs', err);
        }
    };

    const fetchActivos = async (currentUser?: any) => {
        const activeUser = currentUser || user;
        setLoading(true);
        try {
            const res = await invService.getActivos();
            let data = res.data.data || res.data || [];

            if (activeUser?.rolNombre === 'Tecnico' || activeUser?.rolNombre === 'TECNICO') {
                data = data.filter((a: any) =>
                    a.idTecnicoActual === activeUser.idUsuario ||
                    a.idAlmacenActual === activeUser.idAlmacenTecnico
                );
            }

            setActivos(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateActivo = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        try {
            await invService.crearActivo(formAlta);
            alertSuccess('Activo registrado correctamente');
            setShowCreateModal(false);
            setFormAlta({ serial: '', idProducto: '', idAlmacen: '', estado: 'ALMACEN' });
            fetchActivos();
        } catch (err) {
            console.error(err);
        } finally {
            setProcessing(false);
        }
    };

    const handleAsignar = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        try {
            await invService.asignarActivo(formAsignar);
            alertSuccess('Activo asignado exitosamente');
            setShowAssignModal(false);
            fetchActivos();
        } catch (err) {
            console.error(err);
        } finally {
            setProcessing(false);
        }
    };

    const fetchHistorial = async (id: number) => {
        setLoadingHistorial(true);
        try {
            const res = await invService.getHistorialActivo(id);
            setHistorial(res.data.data || res.data || []);
        } catch (err) {
            console.error('Error loading asset history', err);
        } finally {
            setLoadingHistorial(false);
        }
    };

    const handleViewDetail = (row: any) => {
        setSelectedActivo(row);
        setActiveTab('detalle');
        setShowDetailModal(true);
        fetchHistorial(row.idActivo);
    };

    const handleDeleteActivo = async (id: number) => {
        if (!confirm('¿Seguro de deshabilitar este activo? Se mantendrá en el historial pero no podrá ser asignado.')) return;
        try {
            await invService.deleteActivo(id);
            alertSuccess('Activo deshabilitado correctamente');
            fetchActivos();
        } catch (e) { alertError('Error al deshabilitar activo'); }
    };

    const columns = [
        {
            key: 'serial',
            label: 'Número de Serie',
            render: (val: string, row: any) => <strong style={{ color: 'var(--accent)', cursor: 'pointer' }} onClick={() => handleViewDetail(row)}>{val}</strong>
        },
        { key: 'productoNombre', label: 'Modelo/Equipo' },
        {
            key: 'estado',
            label: 'Estado Actual',
            render: (val: string) => {
                const colors: any = {
                    'ALMACEN': '#10b981',
                    'INSTALADO': '#3b82f6',
                    'REPARACION': '#f59e0b',
                    'BAJA': '#ef4444',
                    'TECNICO': '#8b5cf6'
                };
                return <span className="badge" style={{ background: colors[val] + '22', color: colors[val] }}>{val}</span>
            }
        },
        {
            key: 'ubicacionNombre',
            label: 'Asignado A / Ubicación',
            render: (val: string, row: any) => (
                <div>
                    {row.tecnicoNombre ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '1.2rem' }}>👤</span>
                            <div>
                                <div style={{ fontWeight: 600 }}>{row.tecnicoNombre}</div>
                                <div style={{ fontSize: '0.75rem', color: '#888' }}>Técnico</div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '1.2rem' }}>🏢</span>
                            <div>
                                <div style={{ fontWeight: 600 }}>{val || 'Bodega Central'}</div>
                                <div style={{ fontSize: '0.75rem', color: '#888' }}>Almacén</div>
                            </div>
                        </div>
                    )}
                </div>
            )
        },
        {
            key: 'acciones',
            label: 'Acciones',
            render: (_: any, row: any) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => handleViewDetail(row)}>Ver</button>
                    {isAdmin && row.estado === 'ALMACEN' && (
                        <button className="btn-primary" style={{ padding: '4px 8px', fontSize: '0.75rem', background: 'var(--accent)' }}
                            onClick={() => { setFormAsignar({ ...formAsignar, idActivo: row.idActivo }); setShowAssignModal(true); }}>
                            Asignar
                        </button>
                    )}
                    {isAdmin && row.estado !== 'BAJA' && (
                        <button className="btn-danger" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => handleDeleteActivo(row.idActivo)}>
                            Inhabilitar
                        </button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div style={{ animation: 'fadeIn 0.5s' }}>
            <DataTable
                title={isTecnico ? "Mis Herramientas y Equipos" : "Trazabilidad de Activos"}
                description={isTecnico ? "Equipos y herramientas asignados a tu cargo para la operación." : "Control individual por número de serie para equipos terminales y nodos."}
                columns={columns}
                data={activos}
                loading={loading}
                allowExport={true}
                actions={
                    isAdmin && (
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="btn-primary" onClick={() => setShowCreateModal(true)}>+ Alta de Activo</button>
                        </div>
                    )
                }
            />

            {/* Modal: Registro de Nuevo Activo */}
            <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Alta de Nuevo Activo (S/N)">
                <form onSubmit={handleCreateActivo}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div>
                            <label className="form-label">Número de Serie (S/N)</label>
                            <input className="input" required value={formAlta.serial} onChange={e => setFormAlta({ ...formAlta, serial: e.target.value })} placeholder="Ej: SN-90210" />
                        </div>
                        <div>
                            <label className="form-label">Modelo / Producto</label>
                            <select className="select" required value={formAlta.idProducto} onChange={e => setFormAlta({ ...formAlta, idProducto: e.target.value })}>
                                <option value="">Seleccione...</option>
                                {productos.map(p => <option key={p.idProducto} value={p.idProducto}>{p.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Almacén Inicial</label>
                            <select className="select" required value={formAlta.idAlmacen} onChange={e => setFormAlta({ ...formAlta, idAlmacen: e.target.value })}>
                                <option value="">Seleccione...</option>
                                {almacenes.map(a => <option key={a.idAlmacen} value={a.idAlmacen}>{a.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Estado Inicial</label>
                            <select className="select" value={formAlta.estado} onChange={e => setFormAlta({ ...formAlta, estado: e.target.value })}>
                                <option value="ALMACEN">ALMACÉN</option>
                                <option value="REPARACION">REPARACIÓN</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)} disabled={processing}>Cancelar</button>
                        <button type="submit" className="btn-primary" disabled={processing}>{processing ? 'Registrando...' : 'Registrar Activo'}</button>
                    </div>
                </form>
            </Modal>

            {/* Modal: Asignación a Técnico */}
            <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Asignar Activo a Técnico">
                <form onSubmit={handleAsignar}>
                    <div style={{ marginBottom: '15px' }}>
                        <label className="form-label">Técnico Responsable</label>
                        <select className="select" required value={formAsignar.idTecnico} onChange={e => setFormAsignar({ ...formAsignar, idTecnico: e.target.value })}>
                            <option value="">Seleccione Técnico...</option>
                            {usuarios.map(u => <option key={u.idUsuario} value={u.idUsuario}>{u.nombre} ({u.rolNombre})</option>)}
                        </select>
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <label className="form-label">Notas de Asignación</label>
                        <textarea className="input" style={{ height: '80px' }} value={formAsignar.notas} onChange={e => setFormAsignar({ ...formAsignar, notas: e.target.value })} placeholder="Ej: Equipo para cuadrilla de fibra" />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button type="button" className="btn-secondary" onClick={() => setShowAssignModal(false)} disabled={processing}>Cancelar</button>
                        <button type="submit" className="btn-primary" disabled={processing}>{processing ? 'Asignando...' : 'Confirmar Asignación'}</button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                title={`Detalle de Activo: ${selectedActivo?.serial || ''}`}
                width="700px"
            >
                {selectedActivo && (
                    <div>
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid var(--border)' }}>
                            <button onClick={() => setActiveTab('detalle')} className={`tab-btn ${activeTab === 'detalle' ? 'active' : ''}`}>Información</button>
                            <button onClick={() => setActiveTab('historial')} className={`tab-btn ${activeTab === 'historial' ? 'active' : ''}`}>📜 Historial de Movimientos</button>
                        </div>

                        {activeTab === 'detalle' ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px' }}>
                                <div><label className="form-label">Modelo</label><div style={{ fontWeight: 700 }}>{selectedActivo.productoNombre}</div></div>
                                <div><label className="form-label">Estado</label><div className="badge badge-accent">{selectedActivo.estado}</div></div>
                                <div><label className="form-label">Ubicación Actual</label><div>{selectedActivo.ubicacionNombre || 'S/D'}</div></div>
                                <div><label className="form-label">Fecha Alta</label><div>{new Date(selectedActivo.fechaRegistro || Date.now()).toLocaleDateString()}</div></div>
                            </div>
                        ) : (
                            <div className="historial-container">
                                {loadingHistorial ? (
                                    <p>Cargando trazabilidad...</p>
                                ) : historial.length === 0 ? (
                                    <p style={{ color: '#666' }}>No hay movimientos registrados para este activo.</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {historial.map((h: any, i: number) => (
                                            <div key={i} className="historial-item">
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                                    <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{h.tipoMovimiento || 'Movimiento'}</span>
                                                    <span style={{ fontSize: '0.8rem', color: '#888' }}>{new Date(h.fecha).toLocaleString()}</span>
                                                </div>
                                                <div style={{ fontSize: '0.9rem' }}>{h.descripcion || h.notas || `Cambio de ubicación a ${h.ubicacionDestino}`}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '5px' }}>Responsable: {h.usuarioNombre || 'Sistema'}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            <style>{`
                .form-label { display: block; font-size: 0.75rem; color: #888; margin-bottom: 5px; text-transform: uppercase; font-weight: 700; }
                .tab-btn { padding: 10px 20px; background: transparent; border: none; color: #888; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
                .tab-btn.active { color: var(--primary); border-bottom-color: var(--primary); font-weight: 700; }
                .historial-item { padding: 15px; border-left: 2px solid var(--primary); background: rgba(255,255,255,0.02); border-radius: 0 8px 8px 0; }
            `}</style>
        </div>
    );
};

