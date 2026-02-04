import { useState, useEffect, useRef } from 'react';
import { generateOTPDF } from '../../utils/pdfGenerator';
import { opeService, invService, planService, authService } from '../../services/api.service';
import { alertSuccess, alertError } from '../../services/alert.service';
import { Modal } from '../../components/Modal';
import { DataTable } from '../../components/DataTable';
import { SidePanel } from '../../components/SidePanel';

export const OperacionesView = () => {
    const [ots, setOts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedOT, setSelectedOT] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('detalle');

    const [productos, setProductos] = useState<any[]>([]);
    const [submittingMaterial, setSubmittingMaterial] = useState(false);

    const [formData, setFormData] = useState({
        clienteId: '',
        clienteNombre: '',
        numeroCliente: '',
        contactoNombre: '',
        telefono: '',
        correo: '',
        direccion: '',
        idProyecto: '',
        tipoId: '',
        tipoNombre: 'INSTALACION',
        prioridad: 'MEDIA',
        notas: '',
        descripcionTrabajo: '',
        idTecnicoAsignado: ''
    });

    const [tiposOT, setTiposOT] = useState<any[]>([]);
    const [clientes, setClientes] = useState<any[]>([]);
    const [proyectos, setProyectos] = useState<any[]>([]);
    const [tecnicos, setTecnicos] = useState<any[]>([]);

    // Edit & Reassign State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<any>(null);
    const [reassignTechId, setReassignTechId] = useState('');
    const [historialList, setHistorialList] = useState<any[]>([]);

    const [cierreNotas, setCierreNotas] = useState('');
    const [materialForm, setMaterialForm] = useState({ productoId: '', cantidad: 1 });

    useEffect(() => {
        const u = localStorage.getItem('inv_user');
        if (u) {
            const parsedUser = JSON.parse(u);
            setUser(parsedUser);
            fetchOTs();
        }
        fetchProductos();
        fetchCatalogos();
    }, []);

    const fetchCatalogos = async () => {
        try {
            const [resTipos, resClientes, resProyectos, resUsers] = await Promise.all([
                invService.getCatalog('tipos-ot'),
                invService.getCatalog('clientes'),
                planService.getProyectos(),
                authService.getUsers()
            ]);
            setTiposOT(resTipos.data.data || resTipos.data || []);
            setClientes(resClientes.data.data || resClientes.data || []);
            setProyectos(resProyectos.data.data || resProyectos.data || []);

            const allUsers = resUsers.data.data || resUsers.data || [];
            // Filter users who have 'TECNICO' or 'Tecnico' role
            const tecs = allUsers.filter((u: any) => u.rolNombre === 'TECNICO' || u.rolNombre === 'Tecnico' || u.role === 'TECNICO');
            setTecnicos(tecs);
        } catch (e: any) {
            if (e.response && (e.response.status === 401 || e.response.status === 403)) return;
            console.error('Error fetching catalogs', e);
        }
    };

    const fetchProductos = async () => {
        try {
            const res = await (invService as any).getStock();
            setProductos(res.data.data || res.data || []);
        } catch (e) {
            console.error('Error fetching products', e);
        }
    };

    const isSupervisor = user?.rolNombre === 'ADMIN' || user?.rolNombre === 'Administrador' || user?.rolNombre === 'Despacho';
    const isTecnico = user?.rolNombre === 'Tecnico' || user?.rolNombre === 'TECNICO';

    const fetchOTs = async () => {
        setLoading(true);
        try {
            const res = await opeService.listarOTs();
            const data = res.data.data || res.data || [];
            // Backend already filters by technician if role is TECNICO
            setOts(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!formData.direccion || (!formData.clienteId && !formData.clienteNombre))
            return alertError('La dirección y el cliente son obligatorios');

        try {
            await opeService.crearOT({
                ...formData,
                idProyecto: formData.idProyecto ? parseInt(formData.idProyecto) : null,
                idCliente: formData.clienteId ? parseInt(formData.clienteId) : null,
                idTipoOT: formData.tipoId ? parseInt(formData.tipoId) : 1, // Default to 1 if not selected
                notas: formData.notas,
                idTecnicoAsignado: formData.idTecnicoAsignado ? parseInt(formData.idTecnicoAsignado) : null
            });

            alertSuccess('Orden de Trabajo creada');
            setShowCreateModal(false);
            setFormData({
                clienteId: '',
                clienteNombre: '',
                numeroCliente: '',
                contactoNombre: '',
                telefono: '',
                correo: '',
                direccion: '',
                idProyecto: '',
                tipoId: '',
                tipoNombre: 'INSTALACION',
                prioridad: 'MEDIA',
                notas: '',
                descripcionTrabajo: '',
                idTecnicoAsignado: ''
            });
            fetchOTs();
        } catch (err) {
            alertError('Error al crear OT');
        }
    };

    const handleAddMaterial = async () => {
        if (!selectedOT || !materialForm.productoId) return alertError('Seleccione un producto');
        setSubmittingMaterial(true);
        try {
            await (opeService as any).registrarConsumo(selectedOT.idOT, {
                productoId: parseInt(materialForm.productoId),
                cantidad: Number(materialForm.cantidad)
            });
            alertSuccess('Material asignado');
            setMaterialForm({ productoId: '', cantidad: 1 });
        } catch (err) {
            alertError('Error al asignar material');
        } finally {
            setSubmittingMaterial(false);
        }
    };

    const statusColor = (status: string) => {
        switch (status) {
            case 'FINALIZADA': return '#10b981';
            case 'ASIGNADA': return '#3b82f6';
            case 'REGISTRADA': return '#f59e0b';
            case 'CANCELADA': return '#ef4444';
            case 'EN_PROGRESO': return '#3b82f6';
            default: return '#6b7280';
        }
    };

    const columns = [
        { key: 'idOT', label: 'ID', render: (val: any) => <b>#{val}</b> },
        {
            key: 'fechaCreacion',
            label: 'Fecha',
            render: (val: string) => val ? new Date(val).toLocaleDateString() : '--'
        },
        {
            key: 'clienteNombre',
            label: 'Cliente',
            render: (val: string, row: any) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{val}</div>
                    <div style={{ fontSize: '0.7rem', color: '#888' }}>{row.tipoOT || row.tipo}</div>
                </div>
            )
        },
        { key: 'clienteDireccion', label: 'Dirección', render: (val: string, row: any) => val || row.direccion },
        { key: 'tecnicoNombre', label: 'Técnico', render: (val: string, row: any) => val || row.tecnico || row.idTecnicoAsignado || '--' },
        {
            key: 'prioridad',
            label: 'Prioridad',
            render: (val: string) => (
                <span style={{ color: val === 'CRITICA' || val === 'ALTA' ? '#ef4444' : '#fff' }}>{val}</span>
            )
        },
        {
            key: 'estado',
            label: 'Estado',
            render: (val: string) => (
                <span className="badge" style={{ background: statusColor(val) + '22', color: statusColor(val) }}>{val}</span>
            )
        },
        {
            key: 'acciones',
            label: 'Acción',
            render: (_: any, row: any) => (
                <button className="btn-secondary" onClick={() => {
                    setSelectedOT(row);
                    setReassignTechId(row.idTecnicoAsignado?.toString() || '');
                    setEditForm({
                        prioridad: row.prioridad,
                        descripcionTrabajo: row.descripcionTrabajo,
                        notas: row.notas,
                        clienteNombre: row.clienteNombre,
                        clienteDireccion: row.clienteDireccion,
                        idTipoOT: row.idTipoOT || ''
                    });
                    setActiveTab('detalle');
                    setHistorialList([]);
                    setShowDetailModal(true);
                }}>Ver</button>
            )
        }
    ];

    // Signature & Checklist State
    const [step, setStep] = useState(1); // 1: Detalle, 2: Checklist, 3: Firma
    const [checklist, setChecklist] = useState({
        epp: false,
        seguridad: false,
        calidad: false,
        limpieza: false
    });
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    const startDrawing = (e: any) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();

        ctx.beginPath();
        // Handle touch or mouse
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        ctx.moveTo(clientX - rect.left, clientY - rect.top);
        setIsDrawing(true);
    };

    const draw = (e: any) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        ctx.lineTo(clientX - rect.left, clientY - rect.top);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    const handleFinalize = async () => {
        if (!checklist.epp || !checklist.seguridad || !checklist.calidad || !checklist.limpieza) {
            return alertError('Debe completar todos los puntos del checklist de seguridad y calidad.');
        }

        const canvas = canvasRef.current;

        try {
            const signatureData = canvas ? canvas.toDataURL() : '';

            // Upload signature if exists
            if (signatureData) {
                await opeService.subirEvidencia(selectedOT.idOT, signatureData, 'FIRMA_CLIENTE');
            }

            await opeService.cerrarOT(selectedOT.idOT, cierreNotas);

            // Generate PDF Report
            try {
                // Pass current selectedOT but update with closure notes
                const otForReport = { ...selectedOT, notas: cierreNotas };
                generateOTPDF(otForReport, signatureData);
                alertSuccess('Orden Finalizada. Descargando reporte...');
            } catch (pdfErr) {
                console.error(pdfErr);
                alertSuccess('Orden Finalizada (Error al generar PDF)');
            }

            setShowDetailModal(false);
            setStep(1);
            fetchOTs();
        } catch (err) {
            alertError('Error al finalizar OT');
        }
    };

    // View Mode Toggle
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

    const renderKanban = () => {
        const columns = {
            'PENDIENTE': { title: 'Pendientes', color: '#f59e0b', items: [] as any[] },
            'EN_PROGRESO': { title: 'En Progreso', color: '#3b82f6', items: [] as any[] },
            'FINALIZADA': { title: 'Finalizadas', color: '#10b981', items: [] as any[] },
        };

        ots.forEach(ot => {
            const status = ot.estado === 'ASIGNADA' ? 'PENDIENTE' : (ot.estado || 'PENDIENTE');
            if (columns[status as keyof typeof columns]) {
                columns[status as keyof typeof columns].items.push(ot);
            } else {
                columns['PENDIENTE'].items.push(ot); // Default fallback
            }
        });

        return (
            <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '20px' }}>
                {Object.entries(columns).map(([key, col]) => (
                    <div key={key} style={{ minWidth: '300px', flex: 1, background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingBottom: '10px', borderBottom: `2px solid ${col.color}` }}>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e2e8f0' }}>{col.title}</h3>
                            <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '10px' }}>{col.items.length}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {col.items.map(ot => (
                                <div
                                    key={ot.idOT}
                                    onClick={() => {
                                        setSelectedOT(ot);
                                        setReassignTechId(ot.idTecnicoAsignado?.toString() || '');
                                        setEditForm({
                                            prioridad: ot.prioridad,
                                            descripcionTrabajo: ot.descripcionTrabajo,
                                            notas: ot.notas,
                                            clienteNombre: ot.clienteNombre,
                                            clienteDireccion: ot.clienteDireccion,
                                            idTipoOT: ot.idTipoOT || ''
                                        });
                                        setActiveTab('detalle');
                                        setShowDetailModal(true);
                                    }}
                                    style={{
                                        background: '#1e293b',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        cursor: 'pointer',
                                        border: '1px solid transparent',
                                        transition: 'all 0.2s'
                                    }}
                                    className="hover:border-blue-500 hover:shadow-lg"
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>#{ot.idOT}</span>
                                        <span style={{
                                            fontSize: '0.65rem',
                                            background: ot.prioridad === 'CRITICA' ? '#ef4444' : 'rgba(255,255,255,0.05)',
                                            color: ot.prioridad === 'CRITICA' ? '#fff' : '#cbd5e1',
                                            padding: '2px 6px',
                                            borderRadius: '4px'
                                        }}>{ot.prioridad}</span>
                                    </div>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px', color: '#f8fafc' }}>{ot.clienteNombre || ot.cliente}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '8px' }}>{ot.tipoOT || ot.tipo || 'Servicio General'}</div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#64748b' }}>
                                        <span>👷 {ot.tecnicoNombre || ot.tecnico || 'Sin Asignar'}</span>
                                    </div>
                                </div>
                            ))}
                            {col.items.length === 0 && (
                                <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.8rem', padding: '20px 0', fontStyle: 'italic' }}>
                                    Sin órdenes
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div style={{ animation: 'fadeIn 0.3s' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px', gap: '10px' }}>
                <div style={{ background: '#1e293b', padding: '4px', borderRadius: '8px', display: 'flex', gap: '4px' }}>
                    <button
                        onClick={() => setViewMode('list')}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            background: viewMode === 'list' ? 'var(--primary)' : 'transparent',
                            color: viewMode === 'list' ? '#fff' : '#64748b',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                        }}
                    >
                        Lista
                    </button>
                    <button
                        onClick={() => setViewMode('kanban')}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            background: viewMode === 'kanban' ? 'var(--primary)' : 'transparent',
                            color: viewMode === 'kanban' ? '#fff' : '#64748b',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                        }}
                    >
                        Tablero
                    </button>
                </div>
                {isSupervisor && <button className="btn-primary" onClick={() => setShowCreateModal(true)}>+ Nueva Orden</button>}
            </div>

            {viewMode === 'list' ? (
                <DataTable
                    title={isTecnico ? "Mis Órdenes de Trabajo" : "Gestión de Órdenes de Trabajo"}
                    description={isTecnico ? "Lista de tareas asignadas para hoy." : "Control operativo de cuadrillas en campo."}
                    columns={columns}
                    data={ots}
                    loading={loading}
                    actions={<div />}
                />
            ) : (
                renderKanban()
            )}

            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Nueva Orden de Trabajo"
                width="600px"
                footer={<>
                    <button className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                    <button className="btn-primary" onClick={handleCreate}>Crear Orden</button>
                </>}
            >
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '15px',
                    maxHeight: '70vh',
                    overflowY: 'auto',
                    paddingRight: '5px'
                }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <h4 style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: 'var(--primary)', borderBottom: '1px solid #333', paddingBottom: '5px' }}>Información del Cliente</h4>
                    </div>
                    <div>
                        <label className="form-label">Cliente (Catálogo)</label>
                        <select className="form-input" value={formData.clienteId} onChange={e => {
                            const c = clientes.find(cl => cl.idCliente === parseInt(e.target.value));
                            setFormData({ ...formData, clienteId: e.target.value, clienteNombre: c?.nombre || '' });
                        }}>
                            <option value="">-- Seleccionar --</option>
                            {clientes.map(c => <option key={c.idCliente} value={c.idCliente}>{c.nombre}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="form-label">Nombre Cliente (Manual)</label>
                        <input className="form-input" placeholder="Si no está en catálogo" value={formData.clienteNombre} onChange={e => setFormData({ ...formData, clienteNombre: e.target.value })} />
                    </div>
                    <div>
                        <label className="form-label">Número de Cliente / Cuenta</label>
                        <input className="form-input" value={formData.numeroCliente} onChange={e => setFormData({ ...formData, numeroCliente: e.target.value })} />
                    </div>
                    <div>
                        <label className="form-label">Persona de Contacto</label>
                        <input className="form-input" value={formData.contactoNombre} onChange={e => setFormData({ ...formData, contactoNombre: e.target.value })} />
                    </div>
                    <div>
                        <label className="form-label">Teléfono</label>
                        <input className="form-input" value={formData.telefono} onChange={e => setFormData({ ...formData, telefono: e.target.value })} />
                    </div>
                    <div>
                        <label className="form-label">Correo Electrónico</label>
                        <input className="form-input" value={formData.correo} onChange={e => setFormData({ ...formData, correo: e.target.value })} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label">Dirección de Trabajo</label>
                        <input className="form-input" value={formData.direccion} onChange={e => setFormData({ ...formData, direccion: e.target.value })} />
                    </div>

                    <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                        <h4 style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: 'var(--primary)', borderBottom: '1px solid #333', paddingBottom: '5px' }}>Detalles de la Orden</h4>
                    </div>
                    <div>
                        <label className="form-label">Tipo de Trabajo</label>
                        <select className="form-input" value={formData.tipoId} onChange={e => setFormData({ ...formData, tipoId: e.target.value })}>
                            <option value="">-- Seleccionar --</option>
                            {tiposOT.map(t => <option key={t.idTipoOT} value={t.idTipoOT}>{t.nombre}</option>)}
                            <option value="1">Instalación</option>
                            <option value="2">Mantenimiento</option>
                            <option value="3">Reparación</option>
                        </select>
                    </div>
                    <div>
                        <label className="form-label">Asignar Técnico</label>
                        <select className="form-input" value={formData.idTecnicoAsignado} onChange={e => setFormData({ ...formData, idTecnicoAsignado: e.target.value })}>
                            <option value="">-- Sin Asignar --</option>
                            {tecnicos.map(t => <option key={t.idUsuario} value={t.idUsuario}>{t.nombre}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="form-label">Prioridad</label>
                        <select className="form-input" value={formData.prioridad} onChange={e => setFormData({ ...formData, prioridad: e.target.value })}>
                            <option value="BAJA">Baja</option>
                            <option value="MEDIA">Media</option>
                            <option value="ALTA">Alta</option>
                            <option value="CRITICA">Crítica (SLA Prioritario)</option>
                        </select>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label">Proyecto Relacionado (Opcional)</label>
                        <select className="form-input" value={formData.idProyecto} onChange={e => setFormData({ ...formData, idProyecto: e.target.value })}>
                            <option value="">-- Ninguno / General --</option>
                            {proyectos.map(p => <option key={p.idProyecto} value={p.idProyecto}>{p.nombre}</option>)}
                        </select>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label">Descripción del Trabajo</label>
                        <textarea className="form-input" style={{ minHeight: '80px' }} value={formData.descripcionTrabajo} onChange={e => setFormData({ ...formData, descripcionTrabajo: e.target.value })} placeholder="Detalles técnicos de la solicitud..." />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label">Notas Internas</label>
                        <input className="form-input" value={formData.notas} onChange={e => setFormData({ ...formData, notas: e.target.value })} placeholder="Observaciones administrativas..." />
                    </div>
                </div>
            </Modal>

            <SidePanel
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                title={`OT #${selectedOT?.idOT || ''} - ${selectedOT?.clienteNombre || ''}`}
                width="700px"
            >
                {selectedOT && (
                    <div className="ot-drawer-content">
                        {/* Status Badge Banner */}
                        <div style={{
                            background: statusColor(selectedOT.estado) + '15',
                            borderLeft: `4px solid ${statusColor(selectedOT.estado)}`,
                            padding: '12px 16px',
                            marginBottom: '24px',
                            borderRadius: '0 8px 8px 0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span style={{ fontWeight: 700, color: statusColor(selectedOT.estado) }}>{selectedOT.estado}</span>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Prioridad: <b style={{ color: '#fff' }}>{selectedOT.prioridad}</b></span>
                        </div>

                        {/* Tabs */}
                        <div style={{ display: 'flex', borderBottom: '1px solid #334155', marginBottom: '20px' }}>
                            <button
                                style={{ padding: '10px 20px', background: 'transparent', border: 'none', borderBottom: activeTab === 'detalle' ? '2px solid #3b82f6' : 'none', color: activeTab === 'detalle' ? '#3b82f6' : '#94a3b8', cursor: 'pointer', fontWeight: 600 }}
                                onClick={() => setActiveTab('detalle')}
                            >
                                Detalle
                            </button>
                            <button
                                style={{ padding: '10px 20px', background: 'transparent', border: 'none', borderBottom: activeTab === 'evidencias' ? '2px solid #3b82f6' : 'none', color: activeTab === 'evidencias' ? '#3b82f6' : '#94a3b8', cursor: 'pointer', fontWeight: 600 }}
                                onClick={async () => {
                                    setActiveTab('evidencias');
                                    try {
                                        const res = await (opeService as any).getEvidencias(selectedOT.idOT);
                                        // Store in editForm purely as a view-model container to avoid adding new top-level state
                                        setEditForm((prev: any) => ({ ...prev, _evidencias: res.data.data || res.data || [] }));
                                    } catch (e) { console.error(e); }
                                }}
                            >
                                Evidencias
                            </button>
                            <button
                                style={{ padding: '10px 20px', background: 'transparent', border: 'none', borderBottom: activeTab === 'historial' ? '2px solid #3b82f6' : 'none', color: activeTab === 'historial' ? '#3b82f6' : '#94a3b8', cursor: 'pointer', fontWeight: 600 }}
                                onClick={() => {
                                    setActiveTab('historial');
                                    opeService.getHistorialOT(selectedOT.idOT).then(r => setHistorialList(r.data));
                                }}
                            >
                                Historial
                            </button>
                        </div>

                        <div style={{ animation: 'fadeIn 0.3s' }}>
                            {activeTab === 'detalle' ? (
                                <>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                        gap: '20px',
                                        marginBottom: '30px'
                                    }}>
                                        <div><label className="form-label">Cliente</label><div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{selectedOT.clienteNombre || selectedOT.cliente}</div></div>
                                        <div><label className="form-label">Teléfono</label><div style={{ fontFamily: 'monospace' }}>{selectedOT.telefono || '--'}</div></div>
                                        <div><label className="form-label">Contacto</label><div>{selectedOT.contactoNombre || '--'}</div></div>
                                        <div style={{ gridColumn: '1 / -1' }}><label className="form-label">Dirección</label><div style={{ fontSize: '0.95rem', color: '#e2e8f0' }}>{selectedOT.clienteDireccion || selectedOT.direccion}</div></div>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <label className="form-label">Trabajo Requerido</label>
                                            <div style={{ background: '#1e293b', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                                                {selectedOT.descripcionTrabajo || 'Sin descripción detallada.'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Supervisor Actions: Reassign & Edit */}
                                    {isSupervisor && selectedOT.estado !== 'FINALIZADA' && (
                                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #334155' }}>
                                            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--primary)' }}>🛠️ Gestión de Orden</h4>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                                <div>
                                                    <label className="form-label">Reasignar Técnico</label>
                                                    <div style={{ display: 'flex', gap: '5px' }}>
                                                        <select
                                                            className="form-input"
                                                            value={reassignTechId}
                                                            onChange={(e) => setReassignTechId(e.target.value)}
                                                        >
                                                            <option value="">-- Sin Asignar --</option>
                                                            {tecnicos.map(t => <option key={t.idUsuario} value={t.idUsuario}>{t.nombre}</option>)}
                                                        </select>
                                                        <button
                                                            className="btn-primary"
                                                            onClick={async () => {
                                                                if (!reassignTechId) return;
                                                                try {
                                                                    await opeService.asignarOT(selectedOT.idOT, parseInt(reassignTechId));
                                                                    alertSuccess('Técnico reasignado');
                                                                    fetchOTs();
                                                                    const techName = tecnicos.find(t => t.idUsuario.toString() === reassignTechId)?.nombre;
                                                                    setSelectedOT({ ...selectedOT, idTecnicoAsignado: parseInt(reassignTechId), tecnicoNombre: techName, estado: selectedOT.estado === 'PENDIENTE' ? 'EN_PROGRESO' : selectedOT.estado });
                                                                } catch (e) { alertError('Error al reasignar'); }
                                                            }}
                                                        >
                                                            💾
                                                        </button>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                                    <button
                                                        className={`btn-secondary ${isEditing ? 'active' : ''}`}
                                                        style={{ width: '100%' }}
                                                        onClick={() => setIsEditing(!isEditing)}
                                                    >
                                                        {isEditing ? 'Cancelar Edición' : '✏️ Editar Datos OT'}
                                                    </button>
                                                </div>
                                            </div>

                                            {isEditing && (
                                                <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', animation: 'fadeIn 0.3s' }}>
                                                    <div style={{ display: 'grid', gap: '10px' }}>
                                                        <div>
                                                            <label className="form-label">Descripción Trabajo</label>
                                                            <textarea className="form-input" value={editForm.descripcionTrabajo} onChange={e => setEditForm({ ...editForm, descripcionTrabajo: e.target.value })} />
                                                        </div>
                                                        <div>
                                                            <label className="form-label">Dirección</label>
                                                            <input className="form-input" value={editForm.clienteDireccion} onChange={e => setEditForm({ ...editForm, clienteDireccion: e.target.value })} />
                                                        </div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                                            <div>
                                                                <label className="form-label">Prioridad</label>
                                                                <select className="form-input" value={editForm.prioridad} onChange={e => setEditForm({ ...editForm, prioridad: e.target.value })}>
                                                                    <option value="BAJA">Baja</option>
                                                                    <option value="MEDIA">Media</option>
                                                                    <option value="ALTA">Alta</option>
                                                                    <option value="CRITICA">Critica</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="form-label">Tipo OT</label>
                                                                <select className="form-input" value={editForm.idTipoOT} onChange={e => setEditForm({ ...editForm, idTipoOT: e.target.value })}>
                                                                    {tiposOT.map(t => <option key={t.idTipoOT} value={t.idTipoOT}>{t.nombre}</option>)}
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <button
                                                            className="btn-primary"
                                                            style={{ marginTop: '10px' }}
                                                            onClick={async () => {
                                                                try {
                                                                    await opeService.actualizarOT(selectedOT.idOT, editForm);
                                                                    alertSuccess('Orden actualizada');
                                                                    setIsEditing(false);
                                                                    fetchOTs();
                                                                    setSelectedOT({ ...selectedOT, ...editForm });
                                                                } catch (e) { alertError('Error al actualizar'); }
                                                            }}
                                                        >
                                                            Guardar Cambios
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Flow for Technicians */}
                                    {isTecnico && selectedOT.estado !== 'FINALIZADA' && (
                                        <div style={{ borderTop: '1px solid #334155', paddingTop: '24px' }}>
                                            {step === 1 && (
                                                <>
                                                    <div style={{ marginBottom: '24px' }}>
                                                        <h4 style={{ fontSize: '1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{ background: '#3b82f6', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>1</span>
                                                            Materiales y Consumos
                                                        </h4>
                                                        <div style={{ background: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
                                                            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexDirection: 'column' }}>
                                                                {/* Improved Product Selector with Filter */}
                                                                <div style={{ position: 'relative' }}>
                                                                    <input
                                                                        placeholder="🔍 Buscar material..."
                                                                        className="form-input"
                                                                        style={{ marginBottom: '5px' }}
                                                                        list="products-list-search"
                                                                        onBlur={(e) => {
                                                                            const val = e.target.value;
                                                                            const found = productos.find(p => p.nombre === val || p.codigo === val);
                                                                            if (found) setMaterialForm({ ...materialForm, productoId: found.idProducto.toString() });
                                                                        }}
                                                                    />
                                                                    <datalist id="products-list-search">
                                                                        {productos.map(p => <option key={p.idProducto} value={p.nombre}>{p.codigo} - Dispon: {p.stockActual}</option>)}
                                                                    </datalist>
                                                                </div>

                                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                                    <select className="form-input" style={{ flex: 1 }} value={materialForm.productoId} onChange={e => setMaterialForm({ ...materialForm, productoId: e.target.value })}>
                                                                        <option value="">-- Seleccionar de lista --</option>
                                                                        {productos.map(p => <option key={p.idProducto} value={p.idProducto}>{p.codigo} - {p.nombre}</option>)}
                                                                    </select>
                                                                    <input type="number" className="form-input" style={{ width: '80px' }} value={materialForm.cantidad} onChange={e => setMaterialForm({ ...materialForm, cantidad: Number(e.target.value) })} min="1" />
                                                                </div>
                                                            </div>

                                                            {(() => {
                                                                const selectedProd = productos.find(p => p.idProducto.toString() === materialForm.productoId);
                                                                const stockDisp = selectedProd ? (selectedProd.stockActual || 0) : 0;
                                                                const hasStock = stockDisp >= materialForm.cantidad;

                                                                return materialForm.productoId ? (
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                        <div style={{ fontSize: '0.85rem', color: hasStock ? '#10b981' : '#ef4444' }}>
                                                                            Stock Disponible: <b>{stockDisp}</b>
                                                                        </div>
                                                                        <button
                                                                            className="btn-primary"
                                                                            style={{ padding: '6px 16px', fontSize: '0.85rem', background: hasStock ? '#3b82f6' : '#64748b', opacity: hasStock ? 1 : 0.7 }}
                                                                            onClick={handleAddMaterial}
                                                                            disabled={submittingMaterial || !hasStock}
                                                                        >
                                                                            {hasStock ? '+ Agregar' : 'No Disponible'}
                                                                        </button>
                                                                    </div>
                                                                ) : null;
                                                            })()}
                                                        </div>
                                                    </div>
                                                    <button className="btn-primary" style={{ width: '100%', background: '#10b981', padding: '12px' }} onClick={() => setStep(2)}>
                                                        Continuar al Cierre
                                                    </button>
                                                </>
                                            )}

                                            {step === 2 && (
                                                <div style={{ animation: 'fadeIn 0.3s' }}>
                                                    <h4 style={{ fontSize: '1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ background: '#3b82f6', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>2</span>
                                                        Checklist de Calidad
                                                    </h4>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                                                        {['epp', 'seguridad', 'calidad', 'limpieza'].map((key) => (
                                                            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: checklist[key as keyof typeof checklist] ? 'rgba(16, 185, 129, 0.1)' : '#1e293b', borderRadius: '8px', cursor: 'pointer', border: checklist[key as keyof typeof checklist] ? '1px solid #10b981' : '1px solid #334155', transition: 'all 0.2s' }}>
                                                                <input type="checkbox" checked={checklist[key as keyof typeof checklist]} onChange={e => setChecklist({ ...checklist, [key]: e.target.checked })} style={{ accentColor: '#10b981', width: '18px', height: '18px' }} />
                                                                <span style={{ fontSize: '0.9rem', color: checklist[key as keyof typeof checklist] ? '#fff' : '#94a3b8' }}>
                                                                    {key === 'epp' ? 'Uso de EPP Completo' :
                                                                        key === 'seguridad' ? 'Zona Segura' :
                                                                            key === 'calidad' ? 'Calidad Verificada' : 'Limpieza Final'}
                                                                </span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '10px' }}>
                                                        <button className="btn-secondary" onClick={() => setStep(1)} style={{ flex: 1 }}>Atrás</button>
                                                        <button className="btn-primary" onClick={() => setStep(3)} style={{ flex: 1 }} disabled={!Object.values(checklist).every(Boolean)}>Siguiente</button>
                                                    </div>
                                                </div>
                                            )}

                                            {step === 3 && (
                                                <div style={{ animation: 'fadeIn 0.3s' }}>
                                                    <h4 style={{ fontSize: '1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ background: '#3b82f6', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>3</span>
                                                        Firma de Conformidad
                                                    </h4>
                                                    <div style={{ marginBottom: '20px' }}>
                                                        <label className="form-label">Notas Finales</label>
                                                        <textarea className="form-input" placeholder="Comentarios del cliente..." value={cierreNotas} onChange={e => setCierreNotas(e.target.value)} style={{ minHeight: '80px', background: '#1e293b', border: '1px solid #334155' }} />
                                                    </div>
                                                    <div style={{ marginBottom: '20px' }}>
                                                        <div style={{ border: '2px dashed #475569', background: '#e2e8f0', borderRadius: '12px', overflow: 'hidden', position: 'relative', touchAction: 'none' }}>
                                                            <canvas
                                                                ref={canvasRef}
                                                                width={600}
                                                                height={200}
                                                                style={{ width: '100%', height: 'auto', minHeight: '150px', display: 'block' }}
                                                                onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
                                                                onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
                                                            />
                                                            <button onClick={clearSignature} style={{ position: 'absolute', bottom: '10px', right: '10px', background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>Borrar</button>
                                                            <div style={{ position: 'absolute', top: '10px', left: '10px', color: '#64748b', fontSize: '0.7rem', pointerEvents: 'none', textTransform: 'uppercase', letterSpacing: '1px' }}>Firma Aquí</div>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '10px' }}>
                                                        <button className="btn-secondary" onClick={() => setStep(2)} style={{ flex: 1 }}>Atrás</button>
                                                        <button className="btn-primary" onClick={handleFinalize} style={{ flex: 2, background: '#10b981', fontWeight: 700 }}>Finalizar Orden</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            ) : activeTab === 'evidencias' ? (
                                <div>
                                    <h4 style={{ fontSize: '0.9rem', marginBottom: '15px', color: '#94a3b8' }}>Evidencia Fotográfica y Documental</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '15px' }}>

                                        {/* Upload Button */}
                                        <div style={{
                                            border: '2px dashed #334155',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            height: '130px',
                                            cursor: 'pointer',
                                            position: 'relative',
                                            background: 'rgba(255,255,255,0.02)',
                                            transition: 'border-color 0.2s'
                                        }} className="upload-box hover:border-blue-500">
                                            <span style={{ fontSize: '2rem', color: '#64748b', marginBottom: '5px' }}>+</span>
                                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Agregar</span>
                                            <input type="file" accept="image/*,.pdf" style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;

                                                try {
                                                    let finalData = '';
                                                    let type = 'ARCHIVO';

                                                    if (file.type.startsWith('image/')) {
                                                        // Convert to WebP using Canvas
                                                        const img = new Image();
                                                        const objectUrl = URL.createObjectURL(file);
                                                        img.src = objectUrl;
                                                        await new Promise(r => img.onload = r);

                                                        const cvs = document.createElement('canvas');
                                                        // Simple resize if too big (max 1280px width)
                                                        const scale = Math.min(1280 / img.width, 1);
                                                        cvs.width = img.width * scale;
                                                        cvs.height = img.height * scale;

                                                        const ctx = cvs.getContext('2d');
                                                        if (ctx) {
                                                            ctx.drawImage(img, 0, 0, cvs.width, cvs.height);
                                                            finalData = cvs.toDataURL('image/webp', 0.8); // 80% Quality WebP
                                                            type = 'FOTO_WEBP';
                                                        } else {
                                                            throw new Error('Canvas Context Error');
                                                        }
                                                        URL.revokeObjectURL(objectUrl);
                                                    } else {
                                                        // PDF or other files -> Base64
                                                        const reader = new FileReader();
                                                        finalData = await new Promise((resolve) => {
                                                            reader.onloadend = () => resolve(reader.result as string);
                                                            reader.readAsDataURL(file);
                                                        });
                                                    }

                                                    await opeService.subirEvidencia(selectedOT.idOT, finalData, type);
                                                    alertSuccess('Evidencia subida correctamente');
                                                    // Refresh list (using temporary editForm prop hack or better state)
                                                    try {
                                                        const ev = await (opeService as any).getEvidencias(selectedOT.idOT);
                                                        setEditForm((prev: any) => ({ ...prev, _evidencias: ev.data || [] }));
                                                    } catch (e) { console.error('Refresh fail', e); }

                                                } catch (err) {
                                                    console.error(err);
                                                    alertError('Error al procesar/subir evidencia');
                                                }
                                            }} />
                                        </div>

                                        {/* Existing Evidences List */}
                                        {(editForm?._evidencias || []).map((ev: any, i: number) => (
                                            <div key={i} style={{
                                                position: 'relative',
                                                height: '130px',
                                                borderRadius: '12px',
                                                overflow: 'hidden',
                                                border: '1px solid #334155'
                                            }}>
                                                {ev.nombre.endsWith('.pdf') ? (
                                                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1e293b', color: '#fff', flexDirection: 'column' }}>
                                                        <span style={{ fontSize: '2rem' }}>📄</span>
                                                        <span style={{ fontSize: '0.6rem', padding: '5px' }}>{ev.nombre.substring(0, 15)}...</span>
                                                    </div>
                                                ) : (
                                                    <img src={ev.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                )}
                                                <a href={ev.url} target="_blank" rel="noreferrer" style={{
                                                    position: 'absolute', bottom: 0, left: 0, right: 0,
                                                    background: 'rgba(0,0,0,0.7)', color: '#fff',
                                                    fontSize: '0.7rem', textAlign: 'center', padding: '4px',
                                                    textDecoration: 'none'
                                                }}>Abrir</a>
                                            </div>
                                        ))}

                                    </div>
                                </div>
                            ) : (<div className="historial-list" style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '500px', overflowY: 'auto' }}>
                                {historialList.length > 0 ? (
                                    historialList.map((h, idx) => (
                                        <div key={idx} style={{ background: '#1e293b', padding: '12px', borderRadius: '8px', borderLeft: `3px solid ${h.accion === 'CREACION' ? '#3b82f6' : h.accion === 'CIERRE' ? '#10b981' : h.accion === 'ASIGNACION' ? '#f59e0b' : '#8b5cf6'}` }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>{h.accion || 'EVENTO'}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{new Date(h.fecha).toLocaleString()}</div>
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: '#e2e8f0' }}>{h.notas || h.detalles}</div>
                                            {h.usuarioNombre && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>Por: {h.usuarioNombre}</div>}
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>Cargando historial o sin registros...</div>
                                )}
                            </div>
                            )}
                        </div>
                    </div>
                )}
            </SidePanel>
        </div>
    );
};
