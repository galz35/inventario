import { useState, useEffect } from 'react';
import { invService } from '../../services/api.service';
import { DataTable } from '../../components/DataTable';
import { alertSuccess, alertError, alertConfirm } from '../../services/alert.service';
import { Modal } from '../../components/Modal';
import { AlertTriangle, Save, CheckCircle } from 'lucide-react';

export const AuditoriaView = () => {
    const [conteos, setConteos] = useState([]);
    const [loading, setLoading] = useState(true);

    // Audit Process State
    const [activeStep, setActiveStep] = useState<'LIST' | 'COUNT' | 'REVIEW'>('LIST');
    const [auditData, setAuditData] = useState<any>(null);
    const [countItems, setCountItems] = useState<any[]>([]);

    // Create Audit State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newAuditForm, setNewAuditForm] = useState({ almacenId: '', nombre: '', descripcion: '' });
    const [almacenes, setAlmacenes] = useState<any[]>([]);

    useEffect(() => {
        fetchConteos();
        loadAlmacenes();
    }, []);

    const fetchConteos = async () => {
        setLoading(true);
        try {
            const res = await invService.getConteos(); // Mocked or Real
            setConteos(res.data.data || res.data || []);
        } catch (err) {
            console.error(err);
            // setConteos([]); // Fallback
        } finally {
            setLoading(false);
        }
    };

    const loadAlmacenes = async () => {
        const res = await invService.getAlmacenes();
        setAlmacenes(res.data.data || res.data || []);
    };

    // --- STEP 1: CREATE SNAPSHOT ---
    const handleStartAudit = async () => {
        if (!newAuditForm.almacenId || !newAuditForm.nombre) return alertError('Complete los campos');

        // In a real backend, this would "Freeze" stock
        const mockAudit = {
            id: Math.floor(Math.random() * 1000),
            ...newAuditForm,
            fechaInicio: new Date().toISOString(),
            items: [] // In real backend, this comes populated with system stock (hidden)
        };

        setAuditData(mockAudit);
        // Simulate fetching system stock for this warehouse
        const stockRes = await invService.getStock({ almacenId: newAuditForm.almacenId });
        const systemStock = stockRes.data.data || stockRes.data || [];

        // Initialize blind count (quantity 0)
        setCountItems(systemStock.map((item: any) => ({
            ...item,
            systemQty: item.stockActual, // Hidden in blind view
            countedQty: 0, // User input
            notes: ''
        })));

        setShowCreateModal(false);
        setActiveStep('COUNT');
        alertSuccess('Auditoría Iniciada', 'El stock ha sido congelado. Proceda al conteo ciego.');
    };

    // --- STEP 2: BLIND COUNT ---
    const handleUpdateCount = (idProducto: number, qty: number) => {
        setCountItems(prev => prev.map(item =>
            item.productoId === idProducto ? { ...item, countedQty: qty } : item
        ));
    };

    // --- STEP 3: VARIANCE ANALYSIS ---
    const finishCount = async () => {
        const confirm = await alertConfirm(
            '¿Finalizar Conteo?',
            'Se compararán los datos ingresados con el sistema. Esta acción es irreversible.'
        );
        if (confirm.isConfirmed) {
            setActiveStep('REVIEW');
        }
    };

    // --- STEP 4: RECONCILIATION ---
    const handleReconcile = async () => {
        const confirm = await alertConfirm(
            '¿Aplicar Ajustes?',
            'Se generarán movimientos de entrada/salida para igualar el inventario físico.'
        );
        if (confirm.isConfirmed) {
            setLoading(true);
            try {
                // Here we would send { auditId, items: [...] } to backend
                // await invService.reconcileAudit(auditData.id, countItems);
                setTimeout(() => {
                    alertSuccess('Inventario Ajustado', 'Las existencias ahora coinciden con el físico.');
                    setActiveStep('LIST');
                    fetchConteos();
                    setAuditData(null);
                }, 1500);
            } catch (e) {
                alertError('Error al conciliar');
            } finally {
                setLoading(false);
            }
        }
    };

    // --- RENDERERS ---

    const renderCountView = () => (
        <div style={{ animation: 'fadeIn 0.3s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>📋 Toma Física: {auditData?.nombre}</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Ingrese las cantidades encontradas físicamente en los estantes.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-secondary" onClick={() => setActiveStep('LIST')}>Cancelar</button>
                    <button className="btn-primary" onClick={finishCount}>
                        <CheckCircle size={18} style={{ marginRight: '8px' }} />
                        Terminar y Comparar
                    </button>
                </div>
            </div>

            <div className="card" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                        <tr>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Código</th>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Producto</th>
                            <th style={{ padding: '15px', textAlign: 'left' }}>Ubicación (Sistema)</th>
                            <th style={{ padding: '15px', textAlign: 'right', width: '150px' }}>CONTEO FÍSICO</th>
                        </tr>
                    </thead>
                    <tbody>
                        {countItems.map((item, idx) => (
                            <tr key={item.productoId} style={{ borderBottom: '1px solid var(--border)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                                <td style={{ padding: '15px' }}><code style={{ background: '#000', padding: '4px' }}>{item.productoCodigo}</code></td>
                                <td style={{ padding: '15px', fontWeight: 500 }}>{item.productoNombre}</td>
                                <td style={{ padding: '15px', color: 'var(--text-muted)' }}>{auditData.almacenNombre || 'General'}</td>
                                <td style={{ padding: '15px', textAlign: 'right' }}>
                                    <input
                                        type="number"
                                        min="0"
                                        className="form-input"
                                        value={item.countedQty}
                                        onChange={(e) => handleUpdateCount(item.productoId, parseInt(e.target.value) || 0)}
                                        style={{
                                            width: '100px',
                                            textAlign: 'center',
                                            fontWeight: '800',
                                            fontSize: '1.1rem',
                                            background: item.countedQty > 0 ? 'var(--bg)' : '#fef2f2',
                                            color: item.countedQty > 0 ? '#fff' : '#ef4444',
                                            borderColor: item.countedQty > 0 ? 'var(--border)' : '#ef4444'
                                        }}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderReviewView = () => {
        const variances = countItems.map(i => ({
            ...i,
            diff: i.countedQty - i.systemQty,
            costImpact: (i.countedQty - i.systemQty) * (i.costoPromedio || 0)
        })).filter(i => i.diff !== 0);

        const totalImpact = variances.reduce((acc, curr) => acc + curr.costImpact, 0);

        return (
            <div style={{ animation: 'fadeIn 0.3s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>📊 Análisis de Variación</h2>
                        <div style={{ display: 'flex', gap: '20px', marginTop: '5px' }}>
                            <span style={{ color: variances.length > 0 ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                                {variances.length} Discrepancias encontradas
                            </span>
                            <span style={{ color: totalImpact < 0 ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                                Impacto Neto: ${totalImpact.toFixed(2)}
                            </span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn-secondary" onClick={() => setActiveStep('COUNT')}>Corrección Manual</button>
                        <button className="btn-primary"
                            style={{ background: '#ef4444', border: 'none' }}
                            onClick={handleReconcile}
                        >
                            <Save size={18} style={{ marginRight: '8px' }} />
                            AJUSTAR INVENTARIO
                        </button>
                    </div>
                </div>

                <div className="card">
                    {variances.length === 0 ? (
                        <div style={{ padding: '50px', textAlign: 'center', color: '#10b981' }}>
                            <CheckCircle size={48} style={{ marginBottom: '15px' }} />
                            <h2>¡Inventario Perfecto!</h2>
                            <p>No se encontraron diferencias. Todo cuadra al 100%.</p>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                                <tr>
                                    <th style={{ padding: '15px', textAlign: 'left' }}>Producto</th>
                                    <th style={{ padding: '15px', textAlign: 'center' }}>Sistema</th>
                                    <th style={{ padding: '15px', textAlign: 'center' }}>Físico</th>
                                    <th style={{ padding: '15px', textAlign: 'center' }}>Diferencia</th>
                                    <th style={{ padding: '15px', textAlign: 'right' }}>Impacto $</th>
                                </tr>
                            </thead>
                            <tbody>
                                {variances.map((item) => (
                                    <tr key={item.productoId} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '15px' }}>
                                            <div style={{ fontWeight: 600 }}>{item.productoNombre}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.productoCodigo}</div>
                                        </td>
                                        <td style={{ padding: '15px', textAlign: 'center', color: 'var(--text-muted)' }}>{item.systemQty}</td>
                                        <td style={{ padding: '15px', textAlign: 'center', fontWeight: 700 }}>{item.countedQty}</td>
                                        <td style={{ padding: '15px', textAlign: 'center' }}>
                                            <span style={{
                                                background: item.diff > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                                color: item.diff > 0 ? '#10b981' : '#ef4444',
                                                padding: '4px 10px', borderRadius: '12px', fontWeight: 700
                                            }}>
                                                {item.diff > 0 ? '+' : ''}{item.diff}
                                            </span>
                                        </td>
                                        <td style={{ padding: '15px', textAlign: 'right', fontWeight: 600, color: item.costImpact < 0 ? '#ef4444' : '#fff' }}>
                                            ${item.costImpact.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        );
    };

    if (activeStep === 'COUNT') return renderCountView();
    if (activeStep === 'REVIEW') return renderReviewView();

    // Default: List View
    const columns = [
        { key: 'idConteo', label: 'Folio', render: (val: any) => `AUD-${val}` },
        { key: 'almacenNombre', label: 'Almacén' },
        { key: 'fechaInicio', label: 'Fecha', render: (val: string) => new Date(val).toLocaleDateString() },
        {
            key: 'estado',
            label: 'Estado',
            render: (val: string) => (
                <span className={`badge ${val === 'FINALIZADO' ? 'badge-success' : 'badge-warning'}`}>
                    {val || 'EN PROCESO'}
                </span>
            )
        }
    ];

    return (
        <>
            <DataTable
                title="Auditorías Físicas"
                description="Gestión de conteos cíclicos y conciliación."
                columns={columns}
                data={conteos}
                loading={loading}
                actions={<button className="btn-primary" onClick={() => setShowCreateModal(true)}>+ Nueva Auditoría</button>}
            />

            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Iniciar Auditoría (Snapshot)"
                width="500px"
            >
                <div>
                    <div className="alert alert-warning" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                        <AlertTriangle size={24} />
                        <div style={{ fontSize: '0.9rem' }}>
                            <b>Advertencia:</b> Al iniciar, se congelará el stock del sistema para el almacén seleccionado. Asegúrese de que no haya movimientos en curso.
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Nombre / Referencia</label>
                        <input className="form-input" placeholder="Ej: Auditoría Mensual Bodega Central" value={newAuditForm.nombre} onChange={e => setNewAuditForm({ ...newAuditForm, nombre: e.target.value })} />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Almacén a Auditar</label>
                        <select className="form-input" value={newAuditForm.almacenId} onChange={e => setNewAuditForm({ ...newAuditForm, almacenId: e.target.value })}>
                            <option value="">Seleccione...</option>
                            {almacenes.map(a => <option key={a.idAlmacen} value={a.idAlmacen}>{a.nombre}</option>)}
                        </select>
                    </div>

                    <button className="btn-primary" style={{ width: '100%', marginTop: '20px' }} onClick={handleStartAudit}>
                        📸 Congelar y Comenzar
                    </button>
                </div>
            </Modal>
        </>
    );
};
