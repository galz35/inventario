import { useState, useEffect } from 'react';
import { opeService, authService } from '../../services/api.service';
import { alertSuccess, alertError } from '../../services/alert.service';
import { DataTable } from '../../components/DataTable';
import { Modal } from '../../components/Modal';
import { UserPlus, Filter, RefreshCw } from 'lucide-react';

export const BacklogView = () => {
    const [ots, setOts] = useState<any[]>([]);
    const [tecnicos, setTecnicos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        estado: 'PENDIENTE',
        prioridad: '',
        sinAsignar: true
    });

    // Modal asignación
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedOT, setSelectedOT] = useState<any>(null);
    const [selectedTecnico, setSelectedTecnico] = useState('');

    useEffect(() => {
        loadData();
    }, [filters]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [otsRes, usersRes] = await Promise.all([
                opeService.listarOTs(filters),
                authService.getUsers()
            ]);

            let otsData = otsRes.data?.data || otsRes.data || [];
            let usersData = usersRes.data?.data || usersRes.data || [];

            // Filtrar solo técnicos
            const tecnicosList = usersData.filter((u: any) =>
                u.rolNombre?.toUpperCase().includes('TECNICO')
            );

            // Aplicar filtro de sin asignar
            if (filters.sinAsignar) {
                otsData = otsData.filter((ot: any) => !ot.idTecnicoAsignado);
            }

            setOts(otsData);
            setTecnicos(tecnicosList);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedOT || !selectedTecnico) return;
        try {
            await opeService.asignarOT(selectedOT.idOT, parseInt(selectedTecnico));
            alertSuccess(`OT #${selectedOT.idOT} asignada correctamente`);
            setShowAssignModal(false);
            setSelectedOT(null);
            setSelectedTecnico('');
            loadData();
        } catch (err) {
            alertError('Error al asignar');
        }
    };

    const columns = [
        {
            key: 'idOT',
            label: 'OT #',
            render: (val: number) => <span style={{ fontWeight: 800, color: 'var(--primary)' }}>#{val}</span>
        },
        {
            key: 'prioridad',
            label: 'Prioridad',
            render: (val: string) => {
                const colors: any = {
                    'CRITICA': { bg: '#7f1d1d', text: '#fca5a5' },
                    'ALTA': { bg: '#991b1b', text: '#fca5a5' },
                    'MEDIA': { bg: '#92400e', text: '#fcd34d' },
                    'BAJA': { bg: '#1e3a5f', text: '#93c5fd' }
                };
                const style = colors[val] || colors['MEDIA'];
                return <span style={{
                    background: style.bg,
                    color: style.text,
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700
                }}>{val}</span>;
            }
        },
        { key: 'clienteNombre', label: 'Cliente' },
        { key: 'clienteDireccion', label: 'Dirección' },
        {
            key: 'fechaCreacion',
            label: 'Creada',
            render: (val: string) => new Date(val).toLocaleDateString()
        },
        {
            key: 'tecnicoNombre',
            label: 'Asignado',
            render: (val: string) => val || <span style={{ color: '#ef4444' }}>Sin Asignar</span>
        },
        {
            key: 'acciones',
            label: 'Acción',
            render: (_: any, row: any) => (
                <button
                    className="btn-primary"
                    style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                    onClick={() => { setSelectedOT(row); setShowAssignModal(true); }}
                >
                    <UserPlus size={14} /> Asignar
                </button>
            )
        }
    ];

    return (
        <div style={{ animation: 'fadeIn 0.3s' }}>
            <header style={{ marginBottom: '30px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '5px' }}>
                    📋 Backlog de Órdenes de Trabajo
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>
                    Gestión centralizada de OTs pendientes y asignación a técnicos.
                </p>
            </header>

            {/* Filtros */}
            <div className="card" style={{ marginBottom: '20px', padding: '15px' }}>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Filter size={16} />
                        <span style={{ fontWeight: 600 }}>Filtros:</span>
                    </div>

                    <select
                        className="form-input"
                        style={{ width: 'auto' }}
                        value={filters.estado}
                        onChange={e => setFilters({ ...filters, estado: e.target.value })}
                    >
                        <option value="">Todos los Estados</option>
                        <option value="PENDIENTE">Pendiente</option>
                        <option value="EN_PROGRESO">En Progreso</option>
                        <option value="FINALIZADA">Finalizada</option>
                    </select>

                    <select
                        className="form-input"
                        style={{ width: 'auto' }}
                        value={filters.prioridad}
                        onChange={e => setFilters({ ...filters, prioridad: e.target.value })}
                    >
                        <option value="">Todas las Prioridades</option>
                        <option value="CRITICA">Crítica</option>
                        <option value="ALTA">Alta</option>
                        <option value="MEDIA">Media</option>
                        <option value="BAJA">Baja</option>
                    </select>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={filters.sinAsignar}
                            onChange={e => setFilters({ ...filters, sinAsignar: e.target.checked })}
                        />
                        Solo Sin Asignar
                    </label>

                    <button className="btn-secondary" onClick={loadData} style={{ marginLeft: 'auto' }}>
                        <RefreshCw size={16} /> Actualizar
                    </button>
                </div>
            </div>

            {/* Métricas Rápidas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '20px' }}>
                <div className="card" style={{ padding: '15px', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ef4444' }}>
                        {ots.filter(o => o.prioridad === 'CRITICA' || o.prioridad === 'ALTA').length}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Urgentes</div>
                </div>
                <div className="card" style={{ padding: '15px', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b' }}>
                        {ots.filter(o => !o.idTecnicoAsignado).length}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Sin Asignar</div>
                </div>
                <div className="card" style={{ padding: '15px', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#3b82f6' }}>
                        {ots.filter(o => o.estado === 'EN_PROGRESO').length}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>En Curso</div>
                </div>
                <div className="card" style={{ padding: '15px', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 800 }}>{ots.length}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Total Backlog</div>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={ots}
                loading={loading}
                title=""
            />

            {/* Modal Asignación */}
            <Modal
                isOpen={showAssignModal}
                onClose={() => setShowAssignModal(false)}
                title={`Asignar OT #${selectedOT?.idOT}`}
                width="500px"
            >
                {selectedOT && (
                    <div>
                        <div style={{ background: '#1a1a1a', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                            <div style={{ fontWeight: 700, marginBottom: '5px' }}>{selectedOT.clienteNombre}</div>
                            <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{selectedOT.clienteDireccion}</div>
                            <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '5px' }}>
                                {selectedOT.descripcionTrabajo}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Seleccionar Técnico</label>
                            <select
                                className="form-input"
                                value={selectedTecnico}
                                onChange={e => setSelectedTecnico(e.target.value)}
                            >
                                <option value="">-- Seleccionar --</option>
                                {tecnicos.map(t => (
                                    <option key={t.idUsuario} value={t.idUsuario}>{t.nombre}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                            <button className="btn-secondary" onClick={() => setShowAssignModal(false)}>Cancelar</button>
                            <button className="btn-primary" onClick={handleAssign} disabled={!selectedTecnico}>
                                Asignar Técnico
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
