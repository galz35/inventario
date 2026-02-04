import { useState, useEffect } from 'react';
import { invService } from '../../services/api.service';
import { DataTable } from '../../components/DataTable';
import { Modal } from '../../components/Modal';
import { alertSuccess, alertError } from '../../services/alert.service';
import { DollarSign, Calendar, FileCheck, AlertCircle, RefreshCw, CheckCircle, ExternalLink } from 'lucide-react';
import { VendorProfileView } from './VendorProfileView';

export const ConsignacionView = () => {
    const [activeTab, setActiveTab] = useState('pending'); // pending | history | stock
    const [liquidations, setLiquidations] = useState([]);
    // consignStock was replaced by groupedStock
    const [providers, setProviders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Navigation State
    const [selectedProvider, setSelectedProvider] = useState<{ id: number, name: string } | null>(null);

    // Create Provider State
    const [showProvModal, setShowProvModal] = useState(false);
    const [newProv, setNewProv] = useState({ nombre: '', direccion: '' });

    // Computed
    const [groupedStock, setGroupedStock] = useState<any>({});
    // Calculation State
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [calculatedDebt, setCalculatedDebt] = useState<any[]>([]);
    const [selectedDebtDetail, setSelectedDebtDetail] = useState<any>(null);
    const [processing, setProcessing] = useState(false);

    // Load Initial Data
    useEffect(() => {
        fetchMasters();
        fetchHistory();
    }, []);

    const fetchMasters = async () => {
        try {
            const res = await invService.getCatalog('proveedores');
            setProviders(res.data.data || res.data || []);
        } catch (e: any) {
            if (e.response && e.response.status === 401) return;
            console.error(e);
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await invService.getLiquidations();
            setLiquidations(res.data.data || res.data || []);
        } catch (e: any) {
            if (e.response && e.response.status === 401) return;
            console.error(e);
        }
    };

    const fetchConsignedStock = async () => {
        setLoading(true);
        try {
            const res = await (invService as any).getConsignedStock();
            const raw = res.data.data || res.data || [];
            // setConsignStock(raw); removed

            // Group by Provider
            const grouped = raw.reduce((acc: any, curr: any) => {
                const pName = curr.proveedorNombre || 'Sin Proveedor Asignado';
                if (!acc[pName]) acc[pName] = [];
                acc[pName].push(curr);
                return acc;
            }, {});
            setGroupedStock(grouped);

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProvider = async () => {
        if (!newProv.nombre) return alertError('Nombre requerido');
        try {
            await invService.saveCatalog('proveedores', newProv);
            alertSuccess('Proveedor creado');
            setShowProvModal(false);
            setNewProv({ nombre: '', direccion: '' });
            fetchMasters();
        } catch (e) { alertError('Error al crear proveedor'); }
    };

    useEffect(() => {
        if (activeTab === 'stock') fetchConsignedStock();
    }, [activeTab]);

    // Core Logic: Calculate Debt for All Providers
    const calculateAll = async () => {
        setLoading(true);
        const results = [];
        try {
            for (const prov of providers) {
                // Fetch calculation for each provider
                const res = await invService.calculateLiquidation(
                    prov.idProveedor,
                    new Date(startDate),
                    new Date(endDate)
                );
                const items = res.data.data || res.data || [];
                // Only add if there is debt
                if (items.length > 0) {
                    const total = items.reduce((acc: number, item: any) => acc + (item.cantidad * item.costoUnitario), 0);
                    results.push({
                        proveedor: prov,
                        total,
                        items // The details
                    });
                }
            }
            setCalculatedDebt(results);
        } catch (e) {
            console.error(e);
            alertError('Error calculando deuda pendiente');
        } finally {
            setLoading(false);
        }
    };

    const handleProcess = async (debtItem: any) => {
        if (!confirm(`¿Confirmar cierre de periodo para ${debtItem.proveedor.nombre} por $${debtItem.total.toFixed(2)}?`)) return;

        setProcessing(true);
        const user = JSON.parse(localStorage.getItem('inv_user') || '{}');
        if (!user.idUsuario) return alertError('Sesión inválida');

        try {
            await invService.processLiquidation({
                proveedorId: debtItem.proveedor.idProveedor,
                idUsuario: user.idUsuario,
                fechaInicio: startDate,
                fechaFin: endDate,
                notas: `Corte ${startDate} a ${endDate}`
            });
            alertSuccess('Liquidación Procesada Exitosamente');
            setSelectedDebtDetail(null);
            calculateAll(); // Refresh pending
            fetchHistory(); // Refresh history
        } catch (e) {
            alertError('Error al procesar liquidación');
        } finally {
            setProcessing(false);
        }
    };

    // Columns for History Table
    const historyColumns = [
        { key: 'idLiquidacion', label: 'Ref #', render: (val: any) => <span style={{ fontFamily: 'monospace' }}>LIQ-{val}</span> },
        { key: 'proveedorNombre', label: 'Proveedor' },
        { key: 'fechaCorte', label: 'Fecha Proceso', render: (d: string) => new Date(d).toLocaleDateString() },
        { key: 'totalPagar', label: 'Monto Total', render: (v: number) => <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>${v.toFixed(2)}</span> },
        { key: 'estado', label: 'Estado', render: (v: string) => <span className="badge badge-success">{v}</span> }
    ];

    // Total Pending Metric
    const totalPending = calculatedDebt.reduce((acc, curr) => acc + curr.total, 0);

    return (
        <div className="animate-fade">
            <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <DollarSign /> Gestión de Deuda a Proveedores (Consignación)
            </h2>

            {selectedProvider ? (
                <VendorProfileView
                    providerId={selectedProvider.id}
                    providerName={selectedProvider.name}
                    onBack={() => setSelectedProvider(null)}
                />
            ) : (
                <>
                    {/* KPI Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                        <div className="card" style={{ padding: '25px', display: 'flex', alignItems: 'center', gap: '20px', borderLeft: '4px solid var(--warning)' }}>
                            <div style={{ padding: '15px', background: 'rgba(234, 179, 8, 0.1)', borderRadius: '50%', color: 'var(--warning)' }}>
                                <AlertCircle size={32} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Deuda Pendiente (Estimada)</div>
                                <div style={{ fontSize: '2rem', fontWeight: 800 }}>${totalPending.toFixed(2)}</div>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Por consumos no liquidados</div>
                            </div>
                        </div>

                        <div className="card" style={{ padding: '25px', display: 'flex', alignItems: 'center', gap: '20px', borderLeft: '4px solid var(--success)' }}>
                            <div style={{ padding: '15px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '50%', color: 'var(--success)' }}>
                                <FileCheck size={32} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Liquidaciones Procesadas</div>
                                <div style={{ fontSize: '2rem', fontWeight: 800 }}>{liquidations.length}</div>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Histórico Total</div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs & Controls */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <div style={{ display: 'flex', gap: '0px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px' }}>
                                <button
                                    className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('pending')}
                                    style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: activeTab === 'pending' ? 'var(--primary)' : 'transparent', color: activeTab === 'pending' ? '#fff' : 'var(--text-secondary)', cursor: 'pointer' }}
                                >
                                    <AlertCircle size={14} style={{ marginRight: '8px' }} /> Pendientes de Pago
                                </button>
                                <button
                                    className={`tab-btn ${activeTab === 'stock' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('stock')}
                                    style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: activeTab === 'stock' ? 'var(--primary)' : 'transparent', color: activeTab === 'stock' ? '#fff' : 'var(--text-secondary)', cursor: 'pointer' }}
                                >
                                    <RefreshCw size={14} style={{ marginRight: '8px' }} /> Stock Actual
                                </button>
                                <button
                                    className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('history')}
                                    style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: activeTab === 'history' ? 'var(--primary)' : 'transparent', color: activeTab === 'history' ? '#fff' : 'var(--text-secondary)', cursor: 'pointer' }}
                                >
                                    <CheckCircle size={14} style={{ marginRight: '8px' }} /> Historial
                                </button>
                            </div>
                            {activeTab === 'stock' && (
                                <button className="btn-secondary" onClick={() => setShowProvModal(true)}>+ Nuevo Proveedor</button>
                            )}
                        </div>

                        {activeTab === 'pending' && (
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: '#1e293b', padding: '10px', borderRadius: '10px' }}>
                                <Calendar size={16} color="var(--text-secondary)" />
                                <input type="date" className="form-input" style={{ width: '130px', padding: '5px' }} value={startDate} onChange={e => setStartDate(e.target.value)} />
                                <span style={{ color: '#64748b' }}>→</span>
                                <input type="date" className="form-input" style={{ width: '130px', padding: '5px' }} value={endDate} onChange={e => setEndDate(e.target.value)} />
                                <button className="btn-primary" onClick={calculateAll} disabled={loading} style={{ marginLeft: '10px', padding: '6px 15px' }}>
                                    {loading ? <RefreshCw className="spin" size={16} /> : 'Calcular Deuda'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Main Content Area */}
                    {activeTab === 'pending' && (
                        <div className="animate-fade">
                            {calculatedDebt.length === 0 && !loading ? (
                                <div style={{ textAlign: 'center', padding: '50px', color: '#64748b', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '2px dashed var(--border)' }}>
                                    <DollarSign size={48} style={{ opacity: 0.2, marginBottom: '10px' }} />
                                    <p>No se encontraron deudas pendientes en el periodo seleccionado.</p>
                                    <p style={{ fontSize: '0.8rem' }}>Intente ajustar las fechas o haga clic en "Calcular Deuda".</p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                                    {calculatedDebt.map((debt, idx) => (
                                        <div key={idx} className="card" style={{ padding: '20px', borderTop: '4px solid var(--warning)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{debt.proveedor.nombre}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Items consumidos: {debt.items.length}</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--warning)' }}>${debt.total.toFixed(2)}</div>
                                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>A Pagar</div>
                                                </div>
                                            </div>
                                            <button
                                                className="btn-secondary"
                                                style={{ width: '100%', marginBottom: '10px' }}
                                                onClick={() => setSelectedDebtDetail(debt)}
                                            >
                                                Ver Detalle de Consumos
                                            </button>
                                            <button
                                                className="btn-primary"
                                                style={{ width: '100%' }}
                                                onClick={() => handleProcess(debt)}
                                                disabled={processing}
                                            >
                                                {processing ? <RefreshCw className="spin" size={16} style={{ margin: '0 auto' }} /> : 'Procesar Liquidación'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'stock' && (
                        <div className="animate-fade">
                            {Object.entries(groupedStock).length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>No hay stock consignado.</div>
                            ) : (
                                Object.entries(groupedStock).map(([providerName, items]: [string, any]) => (
                                    <div key={providerName} style={{ marginBottom: '20px', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                <h3 style={{ fontSize: '1rem', margin: 0, color: '#fbbf24' }}>{providerName}</h3>
                                                <button
                                                    className="btn-text"
                                                    style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: 'var(--primary)' }}
                                                    onClick={() => setSelectedProvider({ id: items[0].proveedorId, name: providerName })}
                                                >
                                                    Ver Perfil <ExternalLink size={12} />
                                                </button>
                                            </div>
                                            <span style={{ fontSize: '0.8rem', color: '#888' }}>{items.length} productos</span>
                                        </div>
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse' }}>
                                                <thead>
                                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', color: '#888', fontSize: '0.8rem' }}>
                                                        <th style={{ padding: '10px 20px' }}>PRODUCTO</th>
                                                        <th style={{ padding: '10px' }}>UBICACIÓN</th>
                                                        <th style={{ padding: '10px 20px' }}>CANTIDAD</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {items.map((item: any, i: number) => (
                                                        <tr key={i} style={{ borderBottom: i === items.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                                                            <td style={{ padding: '10px 20px' }}>
                                                                <div style={{ fontWeight: 600 }}>{item.productoNombre}</div>
                                                                <div style={{ fontSize: '0.75rem', color: '#666' }}>{item.productoCodigo}</div>
                                                            </td>
                                                            <td style={{ padding: '10px', color: '#aaa' }}>{item.almacenNombre}</td>
                                                            <td style={{ padding: '10px 20px', fontWeight: 'bold', fontSize: '1rem', color: 'var(--primary)' }}>{item.cantidad} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: '#666' }}>{item.unidad}</span></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="animate-fade">
                            <DataTable
                                title=""
                                columns={historyColumns}
                                data={liquidations}
                                loading={loading}
                            />
                        </div>
                    )}

                    {/* Detail Modal */}
                    <Modal
                        isOpen={!!selectedDebtDetail}
                        onClose={() => setSelectedDebtDetail(null)}
                        title={selectedDebtDetail ? `Detalle de Consumos: ${selectedDebtDetail.proveedor.nombre}` : ''}
                        width="800px"
                        footer={<button className="btn-secondary" onClick={() => setSelectedDebtDetail(null)}>Cerrar</button>}
                    >
                        {selectedDebtDetail && (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse', minWidth: '500px' }}>
                                    <thead>
                                        <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                                            <th style={{ padding: '10px' }}>Producto</th>
                                            <th style={{ padding: '10px', textAlign: 'right' }}>Cant.</th>
                                            <th style={{ padding: '10px', textAlign: 'right' }}>Costo U.</th>
                                            <th style={{ padding: '10px', textAlign: 'right' }}>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedDebtDetail.items.map((item: any, i: number) => (
                                            <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '10px' }}>{item.productoNombre}</td>
                                                <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600 }}>{item.cantidad}</td>
                                                <td style={{ padding: '10px', textAlign: 'right' }}>${item.costoUnitario}</td>
                                                <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700 }}>${(item.cantidad * item.costoUnitario).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                        <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                            <td colSpan={3} style={{ padding: '15px', textAlign: 'right', fontWeight: 700 }}>TOTAL A PAGAR:</td>
                                            <td style={{ padding: '15px', textAlign: 'right', fontWeight: 800, fontSize: '1.1rem', color: 'var(--success)' }}>
                                                ${selectedDebtDetail.total.toFixed(2)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}

                    </Modal>

                </>
            )}

            <Modal isOpen={showProvModal} onClose={() => setShowProvModal(false)} title="Registrar Nuevo Proveedor" width="400px">
                <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label>Nombre / Razón Social</label>
                    <input type="text" className="form-input" value={newProv.nombre} onChange={e => setNewProv({ ...newProv, nombre: e.target.value })} autoFocus />
                </div>
                <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label>Dirección / Contacto</label>
                    <input type="text" className="form-input" value={newProv.direccion} onChange={e => setNewProv({ ...newProv, direccion: e.target.value })} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button className="btn-secondary" onClick={() => setShowProvModal(false)}>Cancelar</button>
                    <button className="btn-primary" onClick={handleCreateProvider}>Guardar</button>
                </div>
            </Modal>
        </div >
    );
};
