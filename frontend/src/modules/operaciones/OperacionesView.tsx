import { useState, useEffect, useRef } from 'react';
import { generateOTPDF } from '../../utils/pdfGenerator';
import { opeService, invService, planService } from '../../services/api.service';
import { alertSuccess, alertError } from '../../services/alert.service';
import { Modal } from '../../components/Modal';
import { DataTable } from '../../components/DataTable';

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
        descripcionTrabajo: ''
    });

    const [tiposOT, setTiposOT] = useState<any[]>([]);
    const [clientes, setClientes] = useState<any[]>([]);
    const [proyectos, setProyectos] = useState<any[]>([]);

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
            const [resTipos, resClientes, resProyectos] = await Promise.all([
                invService.getCatalog('tipos-ot'),
                invService.getCatalog('clientes'),
                planService.getProyectos()
            ]);
            setTiposOT(resTipos.data.data || resTipos.data || []);
            setClientes(resClientes.data.data || resClientes.data || []);
            setProyectos(resProyectos.data.data || resProyectos.data || []);
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
                notas: formData.notas
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
                descripcionTrabajo: ''
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
                <button className="btn-secondary" onClick={() => { setSelectedOT(row); setActiveTab('detalle'); setShowDetailModal(true); }}>Ver</button>
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
                                    onClick={() => { setSelectedOT(ot); setActiveTab('detalle'); setShowDetailModal(true); }}
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

            <Modal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                title={`Detalle de OT #${selectedOT?.idOT || ''}`}
                width="800px"
            >
                {selectedOT && (
                    <div>
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid var(--border)' }}>
                            <button onClick={() => setActiveTab('detalle')} className={`tab-btn ${activeTab === 'detalle' ? 'active' : ''}`}>Detalle</button>
                            <button onClick={() => setActiveTab('evidencias')} className={`tab-btn ${activeTab === 'evidencias' ? 'active' : ''}`}>Evidencias</button>
                            <button onClick={() => setActiveTab('historial')} className={`tab-btn ${activeTab === 'historial' ? 'active' : ''}`}>Historial</button>
                        </div>

                        {activeTab === 'detalle' ? (
                            <>
                                <div style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    padding: '20px',
                                    borderRadius: '12px',
                                    marginBottom: '20px',
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                                    gap: '15px'
                                }}>
                                    <div><label className="form-label">Cliente</label><div style={{ fontWeight: 700 }}>{selectedOT.clienteNombre || selectedOT.cliente}</div></div>
                                    <div><label className="form-label">Nro Cliente</label><div>{selectedOT.numeroCliente || '--'}</div></div>
                                    <div><label className="form-label">Persona Contacto</label><div>{selectedOT.contactoNombre || '--'}</div></div>
                                    <div><label className="form-label">Teléfono</label><div>{selectedOT.telefono || '--'}</div></div>
                                    <div style={{ gridColumn: '1 / -1' }}><label className="form-label">Descripción del Trabajo</label><div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', fontSize: '0.9rem' }}>{selectedOT.descripcionTrabajo || '--'}</div></div>
                                    <div><label className="form-label">Dirección</label><div style={{ fontSize: '0.85rem' }}>{selectedOT.clienteDireccion || selectedOT.direccion}</div></div>
                                    <div><label className="form-label">Estado</label><div style={{ color: statusColor(selectedOT.estado), fontWeight: 700 }}>{selectedOT.estado}</div></div>
                                    <div><label className="form-label">Técnico</label><div style={{ fontWeight: 600 }}>{selectedOT.tecnicoNombre || selectedOT.tecnico || 'Sin Asignar'}</div></div>
                                </div>

                                {isTecnico && selectedOT.estado !== 'FINALIZADA' && (
                                    <div style={{ borderTop: '1px solid #333', paddingTop: '20px' }}>
                                        {step === 1 && (
                                            <>
                                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '12px', marginBottom: '20px' }}>
                                                    <h4 style={{ fontSize: '0.9rem', marginBottom: '10px' }}>Registrar Consumo de Material</h4>
                                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                                        <select className="form-input" style={{ flex: '1 1 200px' }} value={materialForm.productoId} onChange={e => setMaterialForm({ ...materialForm, productoId: e.target.value })}>
                                                            <option value="">-- Seleccionar Item --</option>
                                                            {productos.map(p => <option key={p.idProducto} value={p.idProducto}>{p.codigo} - {p.nombre}</option>)}
                                                        </select>
                                                        <input type="number" className="form-input" style={{ width: '80px' }} value={materialForm.cantidad} onChange={e => setMaterialForm({ ...materialForm, cantidad: Number(e.target.value) })} min="1" />

                                                        {(() => {
                                                            const selectedProd = productos.find(p => p.idProducto.toString() === materialForm.productoId);
                                                            const stockDisp = selectedProd ? (selectedProd.stockActual || 0) : 0;
                                                            const hasStock = stockDisp >= materialForm.cantidad;

                                                            return (
                                                                <>
                                                                    {materialForm.productoId && (
                                                                        <div style={{
                                                                            display: 'flex', alignItems: 'center',
                                                                            padding: '0 10px', borderRadius: '6px',
                                                                            background: hasStock ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                                                            color: hasStock ? '#10b981' : '#ef4444',
                                                                            fontWeight: 700, fontSize: '0.85rem'
                                                                        }}>
                                                                            Stock: {stockDisp}
                                                                        </div>
                                                                    )}
                                                                    <button
                                                                        className="btn-primary"
                                                                        style={{ flex: '1', opacity: hasStock ? 1 : 0.5, cursor: hasStock ? 'pointer' : 'not-allowed' }}
                                                                        onClick={handleAddMaterial}
                                                                        disabled={submittingMaterial || !hasStock || !materialForm.productoId}
                                                                    >
                                                                        {hasStock ? 'Añadir' : 'Sin Stock'}
                                                                    </button>
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                                <button className="btn-primary" style={{ width: '100%' }} onClick={() => setStep(2)}>Iniciar Cierre de Orden</button>
                                            </>
                                        )}

                                        {step === 2 && (
                                            <div style={{ animation: 'fadeIn 0.3s' }}>
                                                <h4 style={{ color: 'var(--primary)', marginBottom: '15px' }}>Paso 1/2: Checklist de Seguridad y Calidad</h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', cursor: 'pointer' }}>
                                                        <input type="checkbox" checked={checklist.epp} onChange={e => setChecklist({ ...checklist, epp: e.target.checked })} style={{ width: '18px', height: '18px' }} />
                                                        <span>Uso correcto de EPP (Casco, Botas, Guantes)</span>
                                                    </label>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', cursor: 'pointer' }}>
                                                        <input type="checkbox" checked={checklist.seguridad} onChange={e => setChecklist({ ...checklist, seguridad: e.target.checked })} style={{ width: '18px', height: '18px' }} />
                                                        <span>Zona de trabajo segura y señalizada</span>
                                                    </label>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', cursor: 'pointer' }}>
                                                        <input type="checkbox" checked={checklist.calidad} onChange={e => setChecklist({ ...checklist, calidad: e.target.checked })} style={{ width: '18px', height: '18px' }} />
                                                        <span>Trabajo cumple estándar de calidad</span>
                                                    </label>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', cursor: 'pointer' }}>
                                                        <input type="checkbox" checked={checklist.limpieza} onChange={e => setChecklist({ ...checklist, limpieza: e.target.checked })} style={{ width: '18px', height: '18px' }} />
                                                        <span>Limpieza del sitio realizada</span>
                                                    </label>
                                                </div>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button className="btn-secondary" onClick={() => setStep(1)} style={{ flex: 1 }}>Atrás</button>
                                                    <button className="btn-primary" onClick={() => setStep(3)} style={{ flex: 1 }} disabled={!Object.values(checklist).every(Boolean)}>Siguiente</button>
                                                </div>
                                            </div>
                                        )}

                                        {step === 3 && (
                                            <div style={{ animation: 'fadeIn 0.3s' }}>
                                                <h4 style={{ color: 'var(--primary)', marginBottom: '15px' }}>Paso 2/2: Confirmación y Firma</h4>
                                                <div style={{ marginBottom: '15px' }}>
                                                    <label className="form-label">Notas Finales de Cierre</label>
                                                    <textarea className="form-input" placeholder="Observaciones finales..." value={cierreNotas} onChange={e => setCierreNotas(e.target.value)} style={{ minHeight: '60px' }} />
                                                </div>
                                                <div style={{ marginBottom: '15px' }}>
                                                    <label className="form-label">Firma del Cliente / Conformidad</label>
                                                    <div style={{ border: '1px solid #444', background: '#fff', borderRadius: '8px', overflow: 'hidden', position: 'relative', touchAction: 'none' }}>
                                                        <canvas
                                                            ref={canvasRef}
                                                            width={800} // Coordinate system width
                                                            height={250} // Coordinate system height
                                                            style={{
                                                                width: '100%',
                                                                height: 'auto',
                                                                minHeight: '200px',
                                                                cursor: 'crosshair',
                                                                display: 'block'
                                                            }}
                                                            onMouseDown={startDrawing}
                                                            onMouseMove={draw}
                                                            onMouseUp={stopDrawing}
                                                            onMouseLeave={stopDrawing}
                                                            onTouchStart={startDrawing}
                                                            onTouchMove={draw}
                                                            onTouchEnd={stopDrawing}
                                                        />
                                                        <button onClick={clearSignature} style={{ position: 'absolute', bottom: '5px', right: '5px', background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}>Borrar Firma</button>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button className="btn-secondary" onClick={() => setStep(2)} style={{ flex: 1 }}>Atrás</button>
                                                    <button className="btn-primary" onClick={handleFinalize} style={{ flex: 1, background: '#10b981' }}>Finalizar y Firmar</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : activeTab === 'evidencias' ? (
                            <div>
                                <h4 style={{ fontSize: '0.9rem', marginBottom: '15px' }}>Fotos de Respaldo</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px', marginBottom: '20px' }}>
                                    {/* Aquí se listarían las evidencias previas si el API las devolviera */}
                                    <div style={{ border: '2px dashed #444', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '120px', cursor: 'pointer', position: 'relative' }}>
                                        <span style={{ fontSize: '0.8rem', color: '#888' }}>+ Subir Foto</span>
                                        <input type="file" accept="image/*" style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            const reader = new FileReader();
                                            reader.onloadend = async () => {
                                                try {
                                                    await opeService.subirEvidencia(selectedOT.idOT, reader.result as string, 'FOTO_DESPUES');
                                                    alertSuccess('Evidencia subida');
                                                } catch (err) {
                                                    alertError('Error al subir evidencia');
                                                }
                                            };
                                            reader.readAsDataURL(file);
                                        }} />
                                    </div>
                                </div>
                                <p style={{ fontSize: '0.75rem', color: '#666' }}>Las fotos se guardarán como evidencia del trabajo realizado.</p>
                            </div>
                        ) : (
                            <div className="historial-list">
                                <div className="historial-item"><b>Fecha Creación:</b> {new Date(selectedOT.fechaCreacion).toLocaleString()}</div>
                                {selectedOT.fechaAsignacion && <div className="historial-item"><b>Asignada el:</b> {new Date(selectedOT.fechaAsignacion).toLocaleString()}</div>}
                                {selectedOT.estado === 'FINALIZADA' && <div className="historial-item"><b>Nota de Cierre:</b> {selectedOT.notas}</div>}
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};
