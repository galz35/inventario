import { useState, useEffect } from 'react';
import { vehService, authService } from '../../services/api.service';
import { DataTable } from '../../components/DataTable';
import { Modal } from '../../components/Modal';
import { alertSuccess, alertError } from '../../services/alert.service';
import { Car, Plus, Fuel, History, Gauge, UserCircle, Save, Camera } from 'lucide-react';

export const VehiculosView = () => {
    const [vehiculos, setVehiculos] = useState<any[]>([]);
    const [tecnicos, setTecnicos] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Modals
    const [isVehiculoModalOpen, setIsVehiculoModalOpen] = useState(false);
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    const [currentVehiculo, setCurrentVehiculo] = useState<any>(null);
    const [newLog, setNewLog] = useState({
        kmEntrada: '',
        kmSalida: '',
        gastoCombustible: '',
        numeroVoucher: '',
        urlVoucher: ''
    });

    const [newVehiculo, setNewVehiculo] = useState<{
        id?: number;
        placa: string;
        marca: string;
        modelo: string;
        anio: number;
        idTecnicoAsignado: string;
    }>({
        placa: '',
        marca: '',
        modelo: '',
        anio: new Date().getFullYear(),
        idTecnicoAsignado: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [vRes, uRes] = await Promise.all([
                vehService.getVehiculos(),
                authService.getUsers()
            ]);
            setVehiculos(vRes.data || []);

            let users = uRes.data?.data || uRes.data || [];
            if (users.data) users = users.data;
            setTecnicos(Array.isArray(users) ? users.filter((u: any) => u.rolNombre?.toUpperCase().includes('TECNICO')) : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveVehiculo = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await vehService.upsertVehiculo(newVehiculo);
            alertSuccess('Vehículo guardado correctamente');
            setIsVehiculoModalOpen(false);
            loadData();
        } catch (err) {
            alertError('Error al guardar vehículo');
        }
    };

    const handleSaveLog = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await vehService.registrarLog({
                ...newLog,
                idVehiculo: currentVehiculo.idVehiculo
            });
            alertSuccess('Registro diario guardado');
            setIsLogModalOpen(false);
            setNewLog({ kmEntrada: '', kmSalida: '', gastoCombustible: '', numeroVoucher: '', urlVoucher: '' });
        } catch (err) {
            alertError('Error al registrar log');
        }
    };

    const openHistory = async (vehiculo: any) => {
        setCurrentVehiculo(vehiculo);
        try {
            const res = await vehService.getLogs(vehiculo.idVehiculo);
            setLogs(res.data || []);
            setIsHistoryModalOpen(true);
        } catch (err) {
            alertError('Error al cargar historial');
        }
    };

    const columns = [
        {
            key: 'placa',
            label: 'Vehículo',
            render: (val: string, row: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Car size={20} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: '1rem' }}>{val}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{row.marca} {row.modelo} ({row.anio})</div>
                    </div>
                </div>
            )
        },
        {
            key: 'tecnicoNombre',
            label: 'Técnico Asignado',
            render: (val: string) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <UserCircle size={16} color="var(--accent)" />
                    <span style={{ fontWeight: 600 }}>{val || 'Sin asignar'}</span>
                </div>
            )
        },
        {
            key: 'acciones',
            label: 'Acciones',
            render: (_: any, row: any) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => { setCurrentVehiculo(row); setIsLogModalOpen(true); }}>
                        <Plus size={14} style={{ marginRight: '5px' }} /> Log Diario
                    </button>
                    <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => openHistory(row)}>
                        <History size={14} style={{ marginRight: '5px' }} /> Historial
                    </button>
                    <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => {
                        setNewVehiculo({
                            id: row.idVehiculo,
                            placa: row.placa,
                            marca: row.marca,
                            modelo: row.modelo,
                            anio: row.anio,
                            idTecnicoAsignado: row.idTecnicoAsignado || ''
                        });
                        setIsVehiculoModalOpen(true);
                    }}>
                        Editar
                    </button>
                </div>
            )
        }
    ];

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '5px' }}>Gestión de Flota</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Control de vehículos, kilometraje y gastos de combustible.</p>
                </div>
                <button className="btn-primary" onClick={() => {
                    setNewVehiculo({ placa: '', marca: '', modelo: '', anio: new Date().getFullYear(), idTecnicoAsignado: '' });
                    setIsVehiculoModalOpen(true);
                }}>
                    <Plus size={18} style={{ marginRight: '8px' }} /> Nuevo Vehículo
                </button>
            </header>

            <DataTable
                columns={columns}
                data={vehiculos}
                loading={loading}
                title="Vehículos Activos"
            />

            {/* MODAL VEHICULO */}
            <Modal isOpen={isVehiculoModalOpen} onClose={() => setIsVehiculoModalOpen(false)} title={newVehiculo.id ? 'Editar Vehículo' : 'Registrar Vehículo'}>
                <form onSubmit={handleSaveVehiculo} style={{ display: 'grid', gap: '15px' }}>
                    <div className="form-group">
                        <label className="form-label">Placa / Matrícula</label>
                        <input className="form-input" required value={newVehiculo.placa} onChange={e => setNewVehiculo({ ...newVehiculo, placa: e.target.value })} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div className="form-group">
                            <label className="form-label">Marca</label>
                            <input className="form-input" value={newVehiculo.marca} onChange={e => setNewVehiculo({ ...newVehiculo, marca: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Modelo</label>
                            <input className="form-input" value={newVehiculo.modelo} onChange={e => setNewVehiculo({ ...newVehiculo, modelo: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Técnico Responsable</label>
                        <select className="form-input" value={newVehiculo.idTecnicoAsignado} onChange={e => setNewVehiculo({ ...newVehiculo, idTecnicoAsignado: e.target.value })}>
                            <option value="">-- Seleccionar Técnico --</option>
                            {tecnicos.map(t => (
                                <option key={t.idUsuario} value={t.idUsuario}>{t.nombre}</option>
                            ))}
                        </select>
                    </div>
                    <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>
                        <Save size={18} style={{ marginRight: '8px' }} /> Guardar Vehículo
                    </button>
                </form>
            </Modal>

            {/* MODAL LOG DIARIO */}
            <Modal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} title={`Log Diario: ${currentVehiculo?.placa}`}>
                <form onSubmit={handleSaveLog} style={{ display: 'grid', gap: '15px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div className="form-group">
                            <label className="form-label"><Gauge size={14} /> KM Entrada</label>
                            <input type="number" className="form-input" required value={newLog.kmEntrada} onChange={e => setNewLog({ ...newLog, kmEntrada: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label"><Gauge size={14} /> KM Salida</label>
                            <input type="number" className="form-input" required value={newLog.kmSalida} onChange={e => setNewLog({ ...newLog, kmSalida: e.target.value })} />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div className="form-group">
                            <label className="form-label"><Fuel size={14} /> Gasto Combustible ($)</label>
                            <input type="number" step="0.01" className="form-input" value={newLog.gastoCombustible} onChange={e => setNewLog({ ...newLog, gastoCombustible: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">N° Voucher / Factura</label>
                            <input className="form-input" value={newLog.numeroVoucher} onChange={e => setNewLog({ ...newLog, numeroVoucher: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label"><Camera size={14} /> Foto del Voucher (URL/Base64)</label>
                        <input className="form-input" value={newLog.urlVoucher} onChange={e => setNewLog({ ...newLog, urlVoucher: e.target.value })} placeholder="Pega la URL de la imagen o base64" />
                    </div>
                    <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>
                        Registrar Operación
                    </button>
                </form>
            </Modal>

            {/* MODAL HISTORIAL */}
            <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title={`Historial Operativo: ${currentVehiculo?.placa}`} width="800px">
                <div style={{ maxHeight: '500px', overflowY: 'auto' }} className="custom-scroll">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                                <th style={{ padding: '10px' }}>Fecha</th>
                                <th style={{ padding: '10px' }}>Técnico</th>
                                <th style={{ padding: '10px' }}>Kilometraje</th>
                                <th style={{ padding: '10px' }}>Gasto</th>
                                <th style={{ padding: '10px' }}>Voucher</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(l => (
                                <tr key={l.idLog} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                                    <td style={{ padding: '10px' }}>{new Date(l.fechaLog).toLocaleDateString()}</td>
                                    <td style={{ padding: '10px' }}>{l.tecnicoNombre}</td>
                                    <td style={{ padding: '10px' }}>{l.kmEntrada} - {l.kmSalida} KM</td>
                                    <td style={{ padding: '10px', color: 'var(--accent)', fontWeight: 700 }}>${l.gastoCombustible}</td>
                                    <td style={{ padding: '10px' }}>{l.numeroVoucher || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Modal>
        </div>
    );
};
