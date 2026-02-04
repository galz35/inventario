import { useState, useEffect } from 'react';
import { authService, opeService } from '../../services/api.service';
import { DataTable } from '../../components/DataTable';
import { Modal } from '../../components/Modal';
import { alertSuccess, alertError } from '../../services/alert.service';
import { LayoutList, Calendar as CalendarIcon, User, Clock, CheckCircle2, ChevronLeft, ChevronRight, UserPlus, FileText, Plus } from 'lucide-react';

export const WorkloadView = () => {
    const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
    const [tecnicos, setTecnicos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Assignment Modal State
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedTecnico, setSelectedTecnico] = useState<any>(null);
    const [unassignedOts, setUnassignedOts] = useState<any[]>([]);
    const [assignTab, setAssignTab] = useState<'existing' | 'new'>('existing');

    // Quick Create OT Form
    const [newOt, setNewOt] = useState({
        clienteNombre: '',
        clienteDireccion: '',
        tipoOT: 'INSTALACION',
        prioridad: 'MEDIA',
        descripcionTrabajo: '',
        idTipoOT: 1 // Default to 1
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const usersRes = await authService.getUsers();
            let rawUsers = usersRes.data?.data || usersRes.data || [];
            if (rawUsers.data) rawUsers = rawUsers.data;

            const onlyTecnicos = Array.isArray(rawUsers)
                ? rawUsers.filter((u: any) => (u.rolNombre || '').toUpperCase().includes('TECNICO'))
                : [];

            const otsRes = await opeService.listarOTs();
            let rawOts = otsRes.data?.data || otsRes.data || [];
            if (rawOts.data) rawOts = rawOts.data;
            const allOts = Array.isArray(rawOts) ? rawOts : [];

            // Filter for only active work
            const mapped = onlyTecnicos.map(t => ({
                ...t,
                currentWork: allOts.filter(ot => ot.idTecnicoAsignado === t.idUsuario && ot.estado === 'EN_PROGRESO')
            }));

            setTecnicos(mapped);
            setUnassignedOts(allOts.filter(ot => !ot.idTecnicoAsignado || ot.estado === 'PENDIENTE'));
        } catch (err) {
            console.error('Error loading workload:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAssign = (tecnico: any) => {
        setSelectedTecnico(tecnico);
        setIsAssignModalOpen(true);
        setAssignTab('existing');
    };

    const handleAssignExisting = async (idOT: number) => {
        if (!selectedTecnico) return;
        try {
            await opeService.asignarOT(idOT, selectedTecnico.idUsuario);
            alertSuccess(`OT #${idOT} asignada a ${selectedTecnico.nombre}`);
            setIsAssignModalOpen(false);
            loadData();
        } catch (err) {
            alertError('Error al asignar OT');
        }
    };

    const handleQuickCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTecnico) return;
        try {
            await opeService.crearOT({
                ...newOt,
                idTecnicoAsignado: selectedTecnico.idUsuario,
                estado: 'EN_PROGRESO'
            });
            alertSuccess('OT creada y asignada correctamente');
            setIsAssignModalOpen(false);
            setNewOt({ clienteNombre: '', clienteDireccion: '', tipoOT: 'INSTALACION', prioridad: 'MEDIA', descripcionTrabajo: '', idTipoOT: 1 });
            loadData();
        } catch (err) {
            alertError('Error al crear OT');
        }
    };

    const handlePrevMonth = () => {
        const d = new Date(selectedDate);
        d.setMonth(d.getMonth() - 1);
        setSelectedDate(d);
    };

    const handleNextMonth = () => {
        const d = new Date(selectedDate);
        d.setMonth(d.getMonth() + 1);
        setSelectedDate(d);
    };

    const columns = [
        {
            key: 'nombre',
            label: 'Técnico',
            render: (val: string, row: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, color: '#fff' }}>
                        {val.charAt(0)}
                    </div>
                    <div>
                        <div style={{ fontWeight: 700 }}>{val}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{row.carnet || 'S/ID'}</div>
                    </div>
                </div>
            )
        },
        {
            key: 'currentWork',
            label: 'Carga de Trabajo / OTs Activas',
            render: (val: any[]) => (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {val.length === 0 ? (
                        <span style={{ color: '#444', fontSize: '0.85rem' }}>Disponible (Sin asignación)</span>
                    ) : (
                        val.map(ot => (
                            <div key={ot.idOT} style={{
                                padding: '6px 12px',
                                background: 'rgba(59, 130, 246, 0.1)',
                                border: '1px solid rgba(59, 130, 246, 0.2)',
                                borderRadius: '8px',
                                fontSize: '0.8rem'
                            }}>
                                <span style={{ fontWeight: 800, color: 'var(--primary)' }}>#{ot.idOT}</span>
                                <span style={{ margin: '0 6px', opacity: 0.3 }}>|</span>
                                <span style={{ color: '#e2e8f0' }}>{ot.clienteNombre || 'S/C'}</span>
                            </div>
                        ))
                    )}
                </div>
            )
        },
        {
            key: 'status',
            label: 'Disponibilidad',
            render: (_: any, row: any) => {
                const isBusy = row.currentWork && row.currentWork.length > 0;
                return (
                    <span className={`badge ${isBusy ? 'badge-warning' : 'badge-success'}`}>
                        {isBusy ? 'Ocupado' : 'Libre'}
                    </span>
                );
            }
        },
        {
            key: 'acciones',
            label: 'Operación',
            render: (_: any, row: any) => (
                <button
                    className="btn-primary"
                    style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '5px' }}
                    onClick={() => handleOpenAssign(row)}
                >
                    <UserPlus size={14} /> Asignar Caso
                </button>
            )
        }
    ];

    const CalendarView = () => {
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const currentMonth = selectedDate.toLocaleString('es-ES', { month: 'long' });
        const todayDayIndex = new Date().getDay(); // 0-6

        return (
            <div className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, textTransform: 'capitalize' }}>{currentMonth} {selectedDate.getFullYear()}</h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn-secondary" style={{ padding: '5px' }} onClick={handlePrevMonth}><ChevronLeft size={18} /></button>
                        <button className="btn-secondary" style={{ padding: '5px' }} onClick={handleNextMonth}><ChevronRight size={18} /></button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '1px', background: 'var(--border)' }}>
                    <div style={{ background: '#0a0a0a', padding: '10px' }}>Técnico</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#0a0a0a' }}>
                        {days.map((d, i) => <div key={d} style={{ padding: '10px', textAlign: 'center', fontSize: '0.8rem', borderLeft: '1px solid var(--border)', color: i === todayDayIndex ? 'var(--primary)' : '#fff' }}>{d}</div>)}
                    </div>

                    {tecnicos.map(t => (
                        <div key={t.idUsuario} style={{ display: 'contents' }}>
                            <div style={{ background: 'var(--bg-surface)', padding: '15px', borderTop: '1px solid var(--border)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: t.currentWork.length > 0 ? '#f59e0b' : '#10b981' }}></div>
                                {t.nombre}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }}>
                                {[...Array(7)].map((_, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            minHeight: '80px',
                                            borderLeft: '1px solid var(--border)',
                                            padding: '8px',
                                            cursor: 'pointer',
                                            position: 'relative',
                                            transition: 'background 0.2s'
                                        }}
                                        onClick={() => handleOpenAssign(t)}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        {/* Display Current Work in TODAY'S column, just as a visual representation */}
                                        {t.currentWork.length > 0 && i === todayDayIndex && selectedDate.getMonth() === new Date().getMonth() && (
                                            <div style={{ padding: '6px', background: 'var(--primary)', borderRadius: '6px', fontSize: '0.7rem', color: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
                                                <div style={{ fontWeight: 800 }}>OT #{t.currentWork[0].idOT}</div>
                                                <div style={{ opacity: 0.9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.currentWork[0].clienteNombre}</div>
                                            </div>
                                        )}
                                        <div style={{ position: 'absolute', bottom: '8px', right: '8px', opacity: 0.3 }}>
                                            <Plus size={14} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '5px' }}>Técnicos y Carga de Trabajo</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Supervisión en tiempo real de cuadrillas y asignación de casos.</p>
                </div>
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px' }}>
                    <button
                        onClick={() => setViewMode('table')}
                        style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: viewMode === 'table' ? 'var(--primary)' : 'transparent', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.3s' }}
                    >
                        <LayoutList size={18} /> Tabla
                    </button>
                    <button
                        onClick={() => setViewMode('calendar')}
                        style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: viewMode === 'calendar' ? 'var(--primary)' : 'transparent', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.3s' }}
                    >
                        <CalendarIcon size={18} /> Calendario
                    </button>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '15px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{tecnicos.length}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Técnicos Activos</div>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '15px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Clock size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{tecnicos.filter(t => t.currentWork.length > 0).length}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>En Operación</div>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '15px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{tecnicos.filter(t => t.currentWork.length === 0).length}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Disponibles</div>
                    </div>
                </div>
            </div>

            {viewMode === 'table' ? (
                <DataTable
                    columns={columns}
                    data={tecnicos}
                    loading={loading}
                    title="Staff Técnico"
                />
            ) : (
                <CalendarView />
            )}

            {/* ASSIGNMENT MODAL OVERHAUL */}
            <Modal
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                title={`Asignar Trabajo a: ${selectedTecnico?.nombre}`}
                width="700px"
            >
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '15px' }}>
                    <button
                        className={`btn-${assignTab === 'existing' ? 'primary' : 'secondary'}`}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        onClick={() => setAssignTab('existing')}
                    >
                        <FileText size={18} /> Casos Pendientes ({unassignedOts.length})
                    </button>
                    <button
                        className={`btn-${assignTab === 'new' ? 'primary' : 'secondary'}`}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        onClick={() => setAssignTab('new')}
                    >
                        <Plus size={18} /> Crear Nuevo Caso
                    </button>
                </div>

                {assignTab === 'existing' && (
                    <div className="custom-scroll" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {unassignedOts.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                                No hay casos pendientes sin asignar.
                            </div>
                        ) : (
                            unassignedOts.map(ot => (
                                <div key={ot.idOT} style={{
                                    padding: '15px',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border)',
                                    marginBottom: '10px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary)' }}>OT #{ot.idOT}</div>
                                            <span style={{
                                                fontSize: '0.65rem',
                                                padding: '2px 8px',
                                                borderRadius: '6px',
                                                background: ot.prioridad === 'ALTA' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(148, 163, 184, 0.1)',
                                                color: ot.prioridad === 'ALTA' ? '#f87171' : '#94a3b8',
                                                border: `1px solid ${ot.prioridad === 'ALTA' ? '#f8717133' : '#94a3b833'}`,
                                                fontWeight: 800
                                            }}>{ot.prioridad}</span>
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: '#e2e8f0', marginTop: '4px' }}>{ot.clienteNombre}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ot.clienteDireccion}</div>
                                    </div>
                                    <button className="btn-primary" style={{ padding: '8px 15px' }} onClick={() => handleAssignExisting(ot.idOT)}>
                                        Asignar
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {assignTab === 'new' && (
                    <form onSubmit={handleQuickCreate} style={{ display: 'grid', gap: '15px' }}>
                        <div className="form-group">
                            <label className="form-label">Nombre del Cliente</label>
                            <input className="form-input" required value={newOt.clienteNombre} onChange={e => setNewOt({ ...newOt, clienteNombre: e.target.value })} placeholder="Ej: Juan Perez / Empresa X" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Dirección</label>
                            <input className="form-input" required value={newOt.clienteDireccion} onChange={e => setNewOt({ ...newOt, clienteDireccion: e.target.value })} placeholder="Ubicación del servicio" />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div className="form-group">
                                <label className="form-label">Tipo de Trabajo</label>
                                <select className="form-input" value={newOt.tipoOT} onChange={e => setNewOt({ ...newOt, tipoOT: e.target.value })}>
                                    <option value="INSTALACION">Instalación</option>
                                    <option value="MANTENIMIENTO">Mantenimiento</option>
                                    <option value="REPARACION">Reparación</option>
                                    <option value="OTROS">Otros</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Prioridad</label>
                                <select className="form-input" value={newOt.prioridad} onChange={e => setNewOt({ ...newOt, prioridad: e.target.value })}>
                                    <option value="ALTA">Alta (Urgente)</option>
                                    <option value="MEDIA">Media</option>
                                    <option value="BAJA">Baja</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Descripción del Trabajo</label>
                            <textarea className="form-input" style={{ minHeight: '80px' }} value={newOt.descripcionTrabajo} onChange={e => setNewOt({ ...newOt, descripcionTrabajo: e.target.value })} placeholder="Detalles de la labor a realizar..." />
                        </div>
                        <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button type="button" className="btn-secondary" onClick={() => setIsAssignModalOpen(false)}>Cancelar</button>
                            <button type="submit" className="btn-primary">Crear y Asignar OT</button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
};
