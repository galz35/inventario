import { useState, useEffect } from 'react';
import { authService, opeService } from '../../services/api.service';
import { DataTable } from '../../components/DataTable';

import { LayoutList, Calendar as CalendarIcon, User, Clock, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';

export const WorkloadView = () => {
    const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
    const [tecnicos, setTecnicos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Users
            const usersRes = await authService.getUsers();
            let rawUsers = usersRes.data?.data || usersRes.data || [];
            if (rawUsers.data) rawUsers = rawUsers.data;

            // Filter only technicians
            const onlyTecnicos = Array.isArray(rawUsers)
                ? rawUsers.filter((u: any) => (u.rolNombre || '').toUpperCase().includes('TECNICO'))
                : [];

            // 2. Fetch all active OTs to map workload
            const otsRes = await opeService.listarOTs({ estado: 'EN_PROGRESO' });
            let rawOts = otsRes.data?.data || otsRes.data || [];
            if (rawOts.data) rawOts = rawOts.data;
            const activeOts = Array.isArray(rawOts) ? rawOts : [];

            // Map workload to technicians
            const mapped = onlyTecnicos.map(t => ({
                ...t,
                currentWork: activeOts.filter(ot => ot.idTecnicoAsignado === t.idUsuario)
            }));

            setTecnicos(mapped);
        } catch (err) {
            console.error('Error loading workload:', err);
        } finally {
            setLoading(false);
        }
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
                    style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'var(--accent)' }}
                    onClick={() => alert('Próximamente: Panel de asignación rápida')}
                >
                    Asignar Caso
                </button>
            )
        }
    ];

    // Calendar Helper Components
    const CalendarView = () => {
        // Simple 7-day view for workload visualization
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const currentMonth = selectedDate.toLocaleString('default', { month: 'long' });

        return (
            <div className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, textTransform: 'capitalize' }}>{currentMonth} {selectedDate.getFullYear()}</h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn-secondary" style={{ padding: '5px' }} onClick={() => setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() - 1)))}><ChevronLeft size={18} /></button>
                        <button className="btn-secondary" style={{ padding: '5px' }} onClick={() => setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() + 1)))}><ChevronRight size={18} /></button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '1px', background: 'var(--border)' }}>
                    {/* Header */}
                    <div style={{ background: '#0a0a0a', padding: '10px' }}>Técnico</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#0a0a0a' }}>
                        {days.map(d => <div key={d} style={{ padding: '10px', textAlign: 'center', fontSize: '0.8rem', borderLeft: '1px solid var(--border)' }}>{d}</div>)}
                    </div>

                    {/* Rows */}
                    {tecnicos.map(t => (
                        <div key={t.idUsuario} style={{ display: 'contents' }}>
                            <div style={{ background: 'var(--bg-surface)', padding: '15px', borderTop: '1px solid var(--border)', fontSize: '0.85rem', fontWeight: 600 }}>
                                {t.nombre}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }}>
                                {[...Array(7)].map((_, i) => (
                                    <div key={i} style={{ minHeight: '80px', borderLeft: '1px solid var(--border)', padding: '5px' }}>
                                        {/* Mock assignments for visual demo */}
                                        {t.currentWork.length > 0 && i === 2 && (
                                            <div style={{ padding: '4px', background: 'var(--primary)', borderRadius: '4px', fontSize: '0.7rem', color: '#fff' }}>
                                                OT #{t.currentWork[0].idOT}
                                            </div>
                                        )}
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
        </div>
    );
};
