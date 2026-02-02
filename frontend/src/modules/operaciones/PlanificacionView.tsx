import React, { useState, useEffect } from 'react';
import { invService, planService } from '../../services/api.service';
import { alertSuccess, alertError } from '../../services/alert.service';
import { Modal } from '../../components/Modal';
import { DataTable } from '../../components/DataTable';

export const PlanificacionView = () => {
    const [proyectos, setProyectos] = useState([]);
    const [selectedProyecto, setSelectedProyecto] = useState<any>(null);
    const [wbs, setWbs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('wbs');
    const [users, setUsers] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [processing, setProcessing] = useState(false);

    // Project State
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [formProject, setFormProject] = useState({ idProyecto: null as number | null, nombre: '', descripcion: '', fechaInicio: '', idResponsable: '' });

    // Task State
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [formTask, setFormTask] = useState({
        idTarea: null as number | null,
        nombre: '',
        descripcion: '',
        idTareaPadre: null as number | null,
        idProyecto: null as number | null,
        fechaInicioPrevista: '',
        fechaFinPrevista: ''
    });

    // Resource/Estimation State
    const [showResourceModal, setShowResourceModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [productos, setProductos] = useState<any[]>([]);
    const [resourceType, setResourceType] = useState('material'); // material | humano

    // Forms for Assignment
    const [formEst, setFormEst] = useState({ productoId: '', cantidadEstimada: 1, idAlmacenSugerido: '' });
    const [formAssign, setFormAssign] = useState({ idUsuario: '', rol: 'Responsable' });
    const [taskResources, setTaskResources] = useState<{ personal: any[], materiales: any[] }>({ personal: [], materiales: [] });

    useEffect(() => {
        fetchProyectos();
        fetchCatalogs(); // Users & Products
    }, []);

    const fetchCatalogs = async () => {
        try {
            const [resP, resU] = await Promise.all([
                invService.getStock(), // or getCatalog('productos')
                invService.getCatalog('usuarios')
            ]);
            setProductos(resP.data.data || resP.data || []);
            setUsers(resU.data.data || resU.data || []);
        } catch (e) {
            console.warn('Error catalogs', e);
        }
    };

    const fetchProyectos = async () => {
        try {
            const res = await planService.getProyectos();
            setProyectos(res.data.data || res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchWBS = async (id: number) => {
        setLoading(true);
        try {
            const [resWbs, resHist] = await Promise.all([
                planService.getWBS(id),
                planService.getHistorial(id)
            ]);
            setWbs(resWbs.data.data || resWbs.data);
            setHistory(resHist.data.data || resHist.data || []);
        } catch (err) {
            alertError('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProyecto = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        try {
            if (formProject.idProyecto) {
                await planService.updateProyecto(formProject.idProyecto, formProject);
                alertSuccess('Proyecto actualizado');
                if (selectedProyecto?.idProyecto === formProject.idProyecto) {
                    setSelectedProyecto({ ...selectedProyecto, ...formProject });
                }
            } else {
                await planService.createProyecto(formProject);
                alertSuccess('Proyecto creado');
            }
            setShowProjectModal(false);
            setFormProject({ idProyecto: null, nombre: '', descripcion: '', fechaInicio: '', idResponsable: '' });
            fetchProyectos();
        } catch (e) { alertError('Error al guardar proyecto'); }
        finally { setProcessing(false); }
    };

    const handleEditProyecto = (p: any) => {
        setFormProject({
            idProyecto: p.idProyecto,
            nombre: p.nombre,
            descripcion: p.descripcion || '',
            fechaInicio: p.fechaInicio ? p.fechaInicio.split('T')[0] : '',
            idResponsable: p.idResponsable || ''
        });
        setShowProjectModal(true);
    };

    const handleDeleteProyecto = async (id: number) => {
        if (!confirm('¿Seguro de "eliminar" (deshabilitar) este proyecto?')) return;
        try {
            await planService.deleteProyecto(id);
            alertSuccess('Proyecto deshabilitado');
            fetchProyectos();
        } catch (e) { alertError('Error al eliminar'); }
    };

    const handleSaveTask = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        try {
            const dto = {
                ...formTask,
                idProyecto: selectedProyecto.idProyecto,
                fechaInicioPrevista: formTask.fechaInicioPrevista ? new Date(formTask.fechaInicioPrevista) : undefined,
                fechaFinPrevista: formTask.fechaFinPrevista ? new Date(formTask.fechaFinPrevista) : undefined
            };

            if (formTask.idTarea) {
                await planService.updateTarea(formTask.idTarea, dto);
                alertSuccess('Tarea actualizada');
            } else {
                await planService.crearTarea(dto);
                alertSuccess('Tarea creada');
            }

            setShowTaskModal(false);
            setFormTask({ idTarea: null, nombre: '', descripcion: '', idTareaPadre: null, idProyecto: null, fechaInicioPrevista: '', fechaFinPrevista: '' });
            fetchWBS(selectedProyecto.idProyecto);
        } catch (err) { alertError('Error al guardar tarea'); }
        finally { setProcessing(false); }
    };

    const handleEditTask = (t: any) => {
        setFormTask({
            idTarea: t.idTarea,
            nombre: t.nombre,
            descripcion: t.descripcion || '',
            idTareaPadre: t.idTareaPadre,
            idProyecto: t.idProyecto,
            fechaInicioPrevista: t.fechaInicioPrevista ? t.fechaInicioPrevista.split('T')[0] : '',
            fechaFinPrevista: t.fechaFinPrevista ? t.fechaFinPrevista.split('T')[0] : ''
        });
        setShowTaskModal(true);
    };

    const handleOpenResources = (tarea: any) => {
        setSelectedTask(tarea);
        setShowResourceModal(true);
        fetchTaskResources(tarea.idTarea);
        setFormEst({ productoId: '', cantidadEstimada: 1, idAlmacenSugerido: '' });
        setFormAssign({ idUsuario: '', rol: 'Responsable' });
    };

    const fetchTaskResources = async (idTarea: number) => {
        try {
            const res = await planService.getTaskResources(idTarea);
            const data = res.data.data || res.data;
            setTaskResources({
                personal: data.personal || [],
                materiales: data.materiales || []
            });
        } catch (e) { console.error('Error fetching resources', e); }
    };

    const handleSaveResource = async () => {
        setProcessing(true);
        try {
            if (resourceType === 'material') {
                await planService.estimarMaterial({
                    idTarea: selectedTask.idTarea,
                    productoId: parseInt(formEst.productoId),
                    cantidadEstimada: Number(formEst.cantidadEstimada),
                    idAlmacenSugerido: formEst.idAlmacenSugerido ? parseInt(formEst.idAlmacenSugerido) : undefined
                });
                alertSuccess('Material estimado y reservado');
            } else {
                await planService.assignUserToTask({
                    idTarea: selectedTask.idTarea,
                    idUsuario: parseInt(formAssign.idUsuario),
                    rol: formAssign.rol
                });
                alertSuccess('Técnico asignado');
            }
            alertSuccess('Recurso asignado correctamente');
            fetchTaskResources(selectedTask.idTarea);
            // Don't close modal to allow multiple assignments
        } catch (e) { alertError('Error al asignar recurso'); }
        finally { setProcessing(false); }
    };

    const columnsProyectos = [
        { key: 'idProyecto', label: 'ID', render: (val: any) => <b>#{val}</b> },
        { key: 'nombre', label: 'Proyecto' },
        { key: 'responsableNombre', label: 'Responsable' },
        { key: 'estado', label: 'Estado', render: (val: string) => <span className={`badge ${val === 'ACTIVO' ? 'badge-success' : 'badge-warning'}`}>{val}</span> },
        {
            key: 'acciones',
            label: 'Acciones',
            render: (_: any, row: any) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-secondary" onClick={() => { setSelectedProyecto(row); fetchWBS(row.idProyecto); }}>Gestionar</button>
                    <button className="btn-secondary" style={{ padding: '6px' }} onClick={() => handleEditProyecto(row)}>✏️</button>
                    <button className="btn-danger" style={{ padding: '6px' }} onClick={() => handleDeleteProyecto(row.idProyecto)}>🗑️</button>
                </div>
            )
        }
    ];

    return (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            {!selectedProyecto ? (
                <>
                    <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="btn-primary" onClick={() => { setFormProject({ idProyecto: null, nombre: '', descripcion: '', fechaInicio: '', idResponsable: '' }); setShowProjectModal(true); }}>+ Nuevo Proyecto</button>
                    </div>
                    <DataTable
                        title="Planificación de Proyectos"
                        description="Gestión de WBS, recursos y asignaciones."
                        columns={columnsProyectos}
                        data={proyectos}
                        allowExport={true}
                    />
                </>
            ) : (
                <div style={{ animation: 'slideUp 0.4s ease-out' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '16px' }}>
                        <div>
                            <button className="btn-secondary" onClick={() => setSelectedProyecto(null)}>← Volver</button>
                        </div>
                        <div style={{ textAlign: 'right', display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <h2 style={{ margin: 0 }}>{selectedProyecto.nombre}</h2>
                            <button className="btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleEditProyecto(selectedProyecto)}>✏️</button>
                            <div className="badge badge-success">{selectedProyecto.estado}</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '5px', marginBottom: '20px', borderBottom: '1px solid var(--border)' }}>
                        <TabButton active={activeTab === 'wbs'} onClick={() => setActiveTab('wbs')}>Plan de Trabajo (WBS)</TabButton>
                        <TabButton active={activeTab === 'historial'} onClick={() => setActiveTab('historial')}>Historial</TabButton>
                    </div>

                    {activeTab === 'wbs' ? (
                        <div className="card" style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <div>
                                    <h3>Estructura de Tareas</h3>
                                    <p style={{ fontSize: '0.85rem', color: '#aaa' }}>Gestiona las etapas y asigna personal o materiales.</p>
                                </div>
                                <button className="btn-primary" onClick={() => { setFormTask({ ...formTask, idTarea: null, idTareaPadre: null }); setShowTaskModal(true); }}>+ Tarea Raíz</button>
                            </div>

                            {loading ? <div className="spinner"></div> : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {wbs.length === 0 ? <p style={{ textAlign: 'center', color: '#666', padding: '20px', border: '1px dashed #444', borderRadius: '8px' }}>No hay tareas registradas.</p> :
                                        wbs.map((t: any) => (
                                            <div key={t.idTarea} className="wbs-row" style={{ marginLeft: t.idTareaPadre ? '40px' : '0' }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 'bold' }}>{t.nombre}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#888' }}>{t.descripcion}</div>
                                                    <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                                                        {/* Badges for resources (Simulation) */}
                                                        {t.asignadosCount > 0 && <span className="badge" style={{ background: '#3b82f633', color: '#60a5fa', fontSize: '0.7rem' }}>👥 {t.asignadosCount} Asignados</span>}
                                                        {t.costoEstimado > 0 && <span className="badge" style={{ background: '#10b98133', color: '#34d399', fontSize: '0.7rem' }}>💲 ${t.costoEstimado}</span>}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 8px' }} onClick={() => handleEditTask(t)}>✏️</button>
                                                    <button className="btn-secondary" style={{ fontSize: '0.75rem' }} onClick={() => { setFormTask({ ...formTask, idTarea: null, idTareaPadre: t.idTarea }); setShowTaskModal(true); }}>+ Subtarea</button>
                                                    <button className="btn-primary" style={{ fontSize: '0.75rem', background: 'var(--accent)' }} onClick={() => handleOpenResources(t)}>Asignar Recursos</button>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="card" style={{ padding: '20px' }}>
                            <h3>Historial de Movimientos</h3>
                            <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '20px' }}>Registro de asignaciones y eventos del proyecto.</p>

                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #444', color: '#888', fontSize: '0.8rem' }}>
                                        <th style={{ padding: '10px' }}>Fecha</th>
                                        <th style={{ padding: '10px' }}>Evento</th>
                                        <th style={{ padding: '10px' }}>Detalle</th>
                                        <th style={{ padding: '10px' }}>Tarea</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.length === 0 ? (
                                        <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No hay movimientos registrados.</td></tr>
                                    ) : (
                                        history.map((h: any, i: number) => (
                                            <tr key={i} style={{ borderBottom: '1px solid #222' }}>
                                                <td style={{ padding: '10px', fontSize: '0.85rem' }}>{new Date(h.fecha).toLocaleString()}</td>
                                                <td style={{ padding: '10px' }}><span className="badge" style={{ background: '#3b82f633', color: '#60a5fa' }}>{h.tipo}</span></td>
                                                <td style={{ padding: '10px' }}>
                                                    {h.tipo === 'ASIGNACION' && <>Asignado a: <b>{h.detalle}</b> ({h.extra})</>}
                                                </td>
                                                <td style={{ padding: '10px', fontSize: '0.9rem', color: '#ddd' }}>{h.tarea}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )
            }

            {/* Modal Proyecto */}
            <Modal isOpen={showProjectModal} onClose={() => setShowProjectModal(false)} title={formProject.idProyecto ? "Editar Proyecto" : "Nuevo Proyecto"}>
                <form onSubmit={handleSaveProyecto}>
                    <div className="form-group">
                        <label>Nombre</label>
                        <input className="form-input" required value={formProject.nombre} onChange={e => setFormProject({ ...formProject, nombre: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Descripción</label>
                        <textarea className="form-input" value={formProject.descripcion} onChange={e => setFormProject({ ...formProject, descripcion: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Responsable</label>
                        <select className="form-input" value={formProject.idResponsable} onChange={e => setFormProject({ ...formProject, idResponsable: e.target.value })}>
                            <option value="">Seleccione...</option>
                            {users.map((u: any) => <option key={u.idUsuario} value={u.idUsuario}>{u.nombre}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Fecha Inicio</label>
                        <input type="date" className="form-input" value={formProject.fechaInicio} onChange={e => setFormProject({ ...formProject, fechaInicio: e.target.value })} />
                    </div>
                    <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" className="btn-secondary" onClick={() => setShowProjectModal(false)}>Cancelar</button>
                        <button type="submit" className="btn-primary" disabled={processing}>{processing ? 'Guardando...' : (formProject.idProyecto ? 'Actualizar' : 'Crear')}</button>
                    </div>
                </form>
            </Modal>

            {/* Modal Tarea */}
            <Modal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} title={formTask.idTarea ? "Editar Tarea" : "Nueva Tarea"}>
                <form onSubmit={handleSaveTask}>
                    <div className="form-group"><label>Nombre</label><input className="form-input" required value={formTask.nombre} onChange={e => setFormTask({ ...formTask, nombre: e.target.value })} /></div>
                    <div className="form-group"><label>Descripción</label><textarea className="form-input" value={formTask.descripcion} onChange={e => setFormTask({ ...formTask, descripcion: e.target.value })} /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div className="form-group"><label>Inicio</label><input type="date" className="form-input" value={formTask.fechaInicioPrevista} onChange={e => setFormTask({ ...formTask, fechaInicioPrevista: e.target.value })} /></div>
                        <div className="form-group"><label>Fin</label><input type="date" className="form-input" value={formTask.fechaFinPrevista} onChange={e => setFormTask({ ...formTask, fechaFinPrevista: e.target.value })} /></div>
                    </div>
                    <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" className="btn-secondary" onClick={() => setShowTaskModal(false)}>Cancelar</button>
                        <button type="submit" className="btn-primary" disabled={processing}>{processing ? 'Guardando...' : (formTask.idTarea ? 'Actualizar' : 'Guardar')}</button>
                    </div>
                </form>
            </Modal>

            {/* Modal Recursos */}
            <Modal isOpen={showResourceModal} onClose={() => setShowResourceModal(false)} title={`Gestión de Recursos: ${selectedTask?.nombre}`} width="min(800px, 95%)">
                <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', padding: '4px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', width: 'fit-content' }}>
                    <button
                        className={`btn-toggle ${resourceType === 'material' ? 'active' : ''}`}
                        onClick={() => setResourceType('material')}
                        style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: resourceType === 'material' ? 'var(--primary)' : 'transparent', color: resourceType === 'material' ? '#fff' : '#888', cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                        🛠️ Materiales / Activos
                    </button>
                    <button
                        className={`btn-toggle ${resourceType === 'humano' ? 'active' : ''}`}
                        onClick={() => setResourceType('humano')}
                        style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: resourceType === 'humano' ? 'var(--primary)' : 'transparent', color: resourceType === 'humano' ? '#fff' : '#888', cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                        👤 Personal / Técnicos
                    </button>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {resourceType === 'material' ? (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px' }}>
                                <div className="form-group">
                                    <label>1. Seleccionar Producto</label>
                                    <select
                                        className="form-input"
                                        value={formEst.productoId}
                                        onChange={e => setFormEst({ ...formEst, productoId: e.target.value, idAlmacenSugerido: '' })}
                                    >
                                        <option value="">Busque un producto...</option>
                                        {Object.values(
                                            productos.reduce((acc: any, curr: any) => {
                                                const id = curr.productoId || curr.idProducto;
                                                if (id && !acc[id]) acc[id] = curr;
                                                return acc;
                                            }, {})
                                        ).map((p: any) => {
                                            const id = p.productoId || p.idProducto;
                                            return (
                                                <option key={id} value={id}>
                                                    {p.productoNombre || p.nombre || 'Desconocido'}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Cantidad Requ.</label>
                                    <input type="number" className="form-input" value={formEst.cantidadEstimada} onChange={e => setFormEst({ ...formEst, cantidadEstimada: Number(e.target.value) })} />
                                </div>
                            </div>

                            {formEst.productoId && (
                                <div className="form-group" style={{ animation: 'fadeIn 0.3s' }}>
                                    <label>2. Seleccionar Almacén (Disponibilidad)</label>
                                    <select
                                        className="form-input"
                                        value={formEst.idAlmacenSugerido}
                                        onChange={e => setFormEst({ ...formEst, idAlmacenSugerido: e.target.value })}
                                        required
                                    >
                                        <option value="">Seleccione origen...</option>
                                        {productos
                                            .filter((p: any) => (p.productoId || p.idProducto) == formEst.productoId)
                                            .map((p: any, i: number) => (
                                                <option key={`${p.almacenId}-${i}`} value={p.almacenId}>
                                                    {p.almacenNombre || 'Sin Almacén'} — Disponible: {p.cantidad}
                                                </option>
                                            ))
                                        }
                                    </select>
                                </div>
                            )}
                            <p style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '10px' }}>Nota: Se reservará del almacén seleccionado.</p>
                        </>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div className="form-group">
                                <label>Técnico / Usuario</label>
                                <select className="form-input" value={formAssign.idUsuario} onChange={e => setFormAssign({ ...formAssign, idUsuario: e.target.value })}>
                                    <option value="">Seleccione...</option>
                                    {users.map((u: any) => <option key={u.idUsuario} value={u.idUsuario}>{u.nombre} ({u.rolNombre})</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Rol en Tarea</label>
                                <select className="form-input" value={formAssign.rol} onChange={e => setFormAssign({ ...formAssign, rol: e.target.value })}>
                                    <option value="Responsable">Responsable</option>
                                    <option value="Ayudante">Ayudante</option>
                                    <option value="Supervisor">Supervisor</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button className="btn-secondary" onClick={() => setShowResourceModal(false)}>Cancelar</button>
                    <button className="btn-primary" onClick={handleSaveResource} disabled={processing}>{processing ? 'Guardando...' : 'Asignar Recurso'}</button>
                </div>

                <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '15px' }}>📋 Recursos Asignados</h3>

                    <div className="responsive-table-container">
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.05)', color: '#aaa', textAlign: 'left' }}>
                                    <th style={{ padding: '12px', borderRadius: '8px 0 0 8px' }}>Tipo</th>
                                    <th style={{ padding: '12px' }}>Recurso / Nombre</th>
                                    <th style={{ padding: '12px' }}>Detalle / Rol</th>
                                    <th style={{ padding: '12px', borderRadius: '0 8px 8px 0' }}>Ubicación</th>
                                </tr>
                            </thead>
                            <tbody>
                                {taskResources.personal.length === 0 && taskResources.materiales.length === 0 && (
                                    <tr>
                                        <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                                            No hay recursos asignados a esta tarea.
                                        </td>
                                    </tr>
                                )}

                                {taskResources.personal.map((p, i) => (
                                    <tr key={`pers-${i}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '12px' }}>👤 Personal</td>
                                        <td style={{ padding: '12px', fontWeight: 'bold' }}>{p.nombre}</td>
                                        <td style={{ padding: '12px' }}><span className="badge" style={{ background: '#3b82f633', color: '#60a5fa' }}>{p.rol}</span></td>
                                        <td style={{ padding: '12px', color: '#888' }}>-</td>
                                    </tr>
                                ))}

                                {taskResources.materiales.map((m, i) => (
                                    <tr key={`mat-${i}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '12px' }}>📦 Material</td>
                                        <td style={{ padding: '12px', fontWeight: 'bold' }}>{m.productoNombre}</td>
                                        <td style={{ padding: '12px' }}>{Number(m.cantidad)} unidades</td>
                                        <td style={{ padding: '12px', color: '#aaa' }}>{m.almacenNombre || 'No definido'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>


            </Modal>

            <style>{`
                .wbs-row { display: flex; justify-content: space-between; align-items: center; padding: 15px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 8px; margin-bottom: 5px; transition: background 0.2s; }
                .wbs-row:hover { background: rgba(255,255,255,0.05); }
                .tab-btn { padding: 10px 20px; background: transparent; border: none; color: #888; cursor: pointer; border-bottom: 2px solid transparent; }
                .tab-btn.active { color: var(--primary); border-bottom-color: var(--primary); font-weight: bold; }
                .form-group { margin-bottom: 15px; }
                .form-group label { display: block; font-size: 0.8rem; margin-bottom: 5px; color: #aaa; font-weight: 600; text-transform: uppercase; }
                .btn-secondary.active { background: var(--primary); color: white; border-color: var(--primary); }
                .responsive-table-container { overflow-x: auto; -webkit-overflow-scrolling: touch; }
            `}</style>
        </div >
    );
};

const TabButton = ({ active, onClick, children }: any) => (
    <button onClick={onClick} className={`tab-btn ${active ? 'active' : ''}`}>{children}</button>
);
