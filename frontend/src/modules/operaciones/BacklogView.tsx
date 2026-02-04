import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { opeService, authService } from '../../services/api.service';
import { alertSuccess, alertError } from '../../services/alert.service';
import { DataTable } from '../../components/DataTable';
import { Modal } from '../../components/Modal';
import { UserPlus, Filter, RefreshCw, Upload, FileSpreadsheet } from 'lucide-react';

export const BacklogView = () => {
    const [ots, setOts] = useState<any[]>([]);
    const [tecnicos, setTecnicos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        estado: 'PENDIENTE',
        prioridad: '',
        sinAsignar: true
    });

    // Import Excel State
    const [showImportModal, setShowImportModal] = useState(false);
    const [importData, setImportData] = useState<any[]>([]);
    const [isImporting, setIsImporting] = useState(false);

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
                opeService.listarOTs(),
                authService.getUsers()
            ]);

            let otsData = otsRes.data?.data || otsRes.data || [];
            let usersData = usersRes.data?.data || usersRes.data || [];

            // Filtrar solo técnicos
            const tecnicosList = usersData.filter((u: any) =>
                (u.rolNombre && u.rolNombre.toUpperCase().includes('TECNICO')) ||
                (u.role && u.role.toUpperCase().includes('TECNICO'))
            );

            // Compute Workload
            const techsWithLoad = tecnicosList.map((t: any) => {
                const assigned = otsData.filter((o: any) => o.idTecnicoAsignado === t.idUsuario && o.estado !== 'FINALIZADA');
                return { ...t, load: assigned.length, activeOts: assigned };
            });

            // Client-side Filtering Logic
            if (filters.estado) {
                otsData = otsData.filter((ot: any) => ot.estado === filters.estado);
            }

            if (filters.prioridad) {
                otsData = otsData.filter((ot: any) => ot.prioridad === filters.prioridad);
            }

            if (filters.sinAsignar) {
                otsData = otsData.filter((ot: any) => !ot.idTecnicoAsignado || ot.idTecnicoAsignado === 0);
            }

            setOts(otsData);
            setTecnicos(techsWithLoad);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (e: any) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt: any) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);
            setImportData(data);
        };
        reader.readAsBinaryString(file);
    };

    const processImport = async () => {
        setIsImporting(true);
        let count = 0;
        try {
            for (const row of importData as any[]) {
                // Map columns loosely
                const payload = {
                    clienteNombre: row.Cliente || row.CLIENTE || row.cliente || 'Desconocido',
                    clienteDireccion: row.Direccion || row.DIRECCION || row.direccion || 'Sin dirección',
                    descripcionTrabajo: row.Descripcion || row.DESCRIPCION || row.descripcion || 'Importado desde Excel',
                    prioridad: row.Prioridad || row.PRIORIDAD || row.prioridad || 'MEDIA',
                    tipoTrabajo: row.Tipo || row.TIPO || row.tipo || 'MANTENIMIENTO'
                };
                await opeService.crearOT(payload);
                count++;
            }
            alertSuccess(`Se importaron ${count} órdenes correctamente`);
            setShowImportModal(false);
            setImportData([]);
            loadData();
        } catch (e) {
            console.error(e);
            alertError('Error al importar algunas órdenes');
        } finally {
            setIsImporting(false);
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
            <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '5px' }}>
                        📋 Backlog de Órdenes
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>
                        Gestión centralizada de OTs pendientes y carga de técnicos.
                    </p>
                </div>
                <button className="btn-primary" onClick={() => setShowImportModal(true)}>
                    <FileSpreadsheet size={18} style={{ marginRight: '8px' }} />
                    Importar Excel
                </button>
            </header>

            {/* Workload Visualization */}
            <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h4 style={{ margin: '0 0 15px 0', fontSize: '0.9rem', color: '#aaa', textTransform: 'uppercase' }}>Carga de Trabajo Actual (Top Técnicos)</h4>
                <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '10px' }}>
                    {tecnicos.sort((a, b) => b.load - a.load).map((t: any) => (
                        <div key={t.idUsuario} style={{ minWidth: '150px', background: '#1e293b', padding: '15px', borderRadius: '8px', borderLeft: `4px solid ${t.load > 5 ? '#ef4444' : '#10b981'}` }}>
                            <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{t.nombre}</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, margin: '5px 0' }}>{t.load}</div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>OTs Activas</div>
                        </div>
                    ))}
                    {tecnicos.length === 0 && <span style={{ color: '#666', fontSize: '0.9rem' }}>No hay técnicos disponibles.</span>}
                </div>
            </div>

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
                                    <option key={t.idUsuario} value={t.idUsuario}>
                                        {t.nombre} (Carga: {t.load})
                                    </option>
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

            {/* Modal Importar Excel */}
            <Modal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                title="Importar Órdenes Masivas"
                width="600px"
            >
                <div style={{ padding: '20px', textAlign: 'center', border: '2px dashed #444', borderRadius: '10px' }}>
                    <Upload size={48} color="#666" style={{ marginBottom: '10px' }} />
                    <p style={{ marginBottom: '20px', color: '#aaa' }}>
                        Seleccione un archivo Excel (.xlsx) con las columnas:<br />
                        <b>CLIENTE, DIRECCION, DESCRIPCION, PRIORIDAD</b>
                    </p>
                    <input
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleFileUpload}
                        style={{ display: 'block', margin: '0 auto' }}
                    />
                </div>

                {importData.length > 0 && (
                    <div style={{ marginTop: '20px' }}>
                        <h5>Vista Previa ({importData.length} registros)</h5>
                        <div style={{ maxHeight: '200px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '10px', fontSize: '0.8rem' }}>
                            {importData.slice(0, 5).map((row: any, i) => (
                                <div key={i} style={{ borderBottom: '1px solid #333', padding: '4px' }}>
                                    {row.Cliente || row.CLIENTE} - {row.Prioridad || row.PRIORIDAD}
                                </div>
                            ))}
                            {importData.length > 5 && <div>... y {importData.length - 5} más</div>}
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', gap: '10px' }}>
                    <button className="btn-secondary" onClick={() => setShowImportModal(false)}>Cancelar</button>
                    <button className="btn-primary" onClick={processImport} disabled={importData.length === 0 || isImporting}>
                        {isImporting ? 'Procesando...' : 'Importar Órdenes'}
                    </button>
                </div>
            </Modal>
        </div>
    );
};
