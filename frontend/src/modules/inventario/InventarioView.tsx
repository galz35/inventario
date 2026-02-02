import { useState, useEffect } from 'react';
import { invService } from '../../services/api.service';
import { alertSuccess, alertError } from '../../services/alert.service';
import { DataTable } from '../../components/DataTable';
import { Modal } from '../../components/Modal';
import { generateInventoryPDF } from '../../utils/pdfGenerator';
import { FileText } from 'lucide-react';
import { KardexTimeline } from './components/KardexTimeline';

export const InventarioView = () => {
    const [stock, setStock] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [kardex, setKardex] = useState([]);
    const [loadingKardex, setLoadingKardex] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const u = localStorage.getItem('inv_user');
        if (u) setUser(JSON.parse(u));
    }, []);

    const isAdmin = user?.rolNombre === 'ADMIN' || user?.rolNombre === 'Administrador';
    const isBodega = user?.rolNombre === 'BODEGA' || user?.rolNombre === 'Bodega';

    // Almacenes List
    const [almacenes, setAlmacenes] = useState<any[]>([]);
    const [selectedAlmacen, setSelectedAlmacen] = useState<string>('');
    const [productos, setProductos] = useState<any[]>([]);
    const [proveedores, setProveedores] = useState<any[]>([]);

    // Import Excel State
    const [showImportModal, setShowImportModal] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [targetAlmacen, setTargetAlmacen] = useState('');
    const [uploading, setUploading] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Manual Entry State
    const [showEntryModal, setShowEntryModal] = useState(false);
    const [entryType, setEntryType] = useState('EMPRESA'); // EMPRESA | PROVEEDOR
    const [entryForm, setEntryForm] = useState({
        almacenId: '',
        productoId: '',
        cantidad: 1,
        proveedorId: '',
        costoUnitario: 0,
        notas: ''
    });

    const fetchStock = async (almacenId?: string) => {
        setLoading(true);
        try {
            const params = almacenId ? { almacenId } : {};
            const res = await invService.getStock(params);
            setStock(res.data.data || res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMasters = async () => {
        try {
            const [resAlm, resProd, resProv] = await Promise.all([
                invService.getAlmacenes(),
                invService.getCatalog('productos'),
                invService.getCatalog('proveedores')
            ]);

            const alms = resAlm.data.data || resAlm.data || [];

            // DEMO FILTER: Keep only key warehouses to avoid confusion
            // 1: Bodega Central, 2: Regional Norte, 203: Cargo Miguel(Admin), 207: Movil Carlos(Tech)
            const demoIds = [1, 2, 203, 207];
            const filteredAlms = alms.filter((a: any) => demoIds.includes(a.idAlmacen));

            setAlmacenes(filteredAlms);
            setProductos(resProd.data.data || resProd.data || []);
            setProveedores(resProv.data.data || resProv.data || []);

            if (filteredAlms.length > 0) {
                setTargetAlmacen(filteredAlms[0].idAlmacen);
                setEntryForm(prev => ({ ...prev, almacenId: filteredAlms[0].idAlmacen }));
            }
        } catch (error) {
            console.warn("Error cargando maestros");
        }
    };

    const fetchKardex = async (item: any) => {
        setSelectedItem(item);
        setLoadingKardex(true);
        try {
            const res = await invService.getHistoriaProducto(item.productoId, item.almacenId);
            setKardex(res.data.data || res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingKardex(false);
        }
    };

    useEffect(() => {
        fetchStock();
        fetchMasters();
    }, []);

    const handleRegisterEntry = async () => {
        if (!entryForm.productoId || entryForm.cantidad <= 0) return alertError('Datos incompletos');
        if (entryType === 'PROVEEDOR' && !entryForm.proveedorId) return alertError('Seleccione proveedor');

        setProcessing(true);
        try {
            await invService.registrarMovimiento({
                tipoMovimiento: 'ENTRADA',
                almacenDestinoId: parseInt(entryForm.almacenId),
                notas: entryForm.notas || 'Ingreso manual',
                detalles: [{
                    productoId: parseInt(entryForm.productoId),
                    cantidad: Number(entryForm.cantidad),
                    propietarioTipo: entryType,
                    proveedorId: entryType === 'PROVEEDOR' ? parseInt(entryForm.proveedorId) : 0,
                    costoUnitario: Number(entryForm.costoUnitario)
                }]
            });
            alertSuccess('Entrada registrada correctamente');
            setShowEntryModal(false);
            fetchStock(selectedAlmacen);
            // Reset basic fields
            setEntryForm(prev => ({ ...prev, cantidad: 1, notas: '', productoId: '' }));
        } catch (err) {
            alertError('Error al registrar entrada');
        } finally {
            setProcessing(false);
        }
    };

    const columns = [
        { key: 'almacenNombre', label: 'Almacén' },
        {
            key: 'productoCodigo',
            label: 'Código',
            render: (val: string) => <code style={{ background: '#1a1a1a', padding: '4px 8px', borderRadius: '5px' }}>{val}</code>
        },
        { key: 'productoNombre', label: 'Producto' },
        {
            key: 'propietarioTipo',
            label: 'Propietario',
            render: (val: string) => (
                <span className={`badge ${val === 'EMPRESA' ? 'badge-success' : 'badge-warning'} `}>
                    {val === 'EMPRESA' ? 'Propio' : 'Consignación'}
                </span>
            )
        },
        {
            key: 'cantidad',
            label: 'Stock Actual',
            render: (val: number, row: any) => (
                <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--secondary)' }}>
                    {val} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-secondary)' }}>{row.unidad}</span>
                </span>
            )
        },
        {
            key: 'acciones',
            label: 'Acciones',
            render: (_: any, row: any) => (
                <button
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                    onClick={() => fetchKardex(row)}
                >
                    Ver Historial
                </button>
            )
        }
    ];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setImportFile(e.target.files[0]);
        }
    };

    const handleImportExcel = async () => {
        if (!importFile) return alertError('Seleccione un archivo');
        setUploading(true);

        const reader = new FileReader();
        reader.readAsDataURL(importFile);
        reader.onload = async () => {
            try {
                const base64 = (reader.result as string).split(',')[1];
                const res = await invService.importarStock({
                    base64,
                    almacenId: parseInt(targetAlmacen),
                    extension: 'xlsx'
                });
                alertSuccess(`Importación exitosa.Movimiento ID: ${res.data.data?.idMovimiento || res.data.idMovimiento} `);
                setShowImportModal(false);
                setImportFile(null);
                fetchStock();
            } catch (err: any) {
                alertError('Error al importar', err.response?.data?.message || err.message);
            } finally {
                setUploading(false);
            }
        };
        reader.onerror = () => {
            setUploading(false);
            alertError('Error al leer el archivo local');
        };
    };



    // Filter Logic
    const [filterQuery, setFilterQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, LOW_STOCK, HIGH_VALUE

    const filteredStock = stock.filter((item: any) => {
        // 1. Text Search
        const searchTerms = filterQuery.toLowerCase().split(' ');
        const itemText = `${item.productoCodigo} ${item.productoNombre} ${item.categoria || ''} ${item.almacenNombre}`.toLowerCase();
        const matchesSearch = searchTerms.every(term => itemText.includes(term));

        // 2. Status Filter
        let matchesStatus = true;
        if (filterStatus === 'LOW_STOCK') {
            matchesStatus = (item.stockActual || 0) <= (item.minimo || 5);
        } else if (filterStatus === 'HIGH_VALUE') {
            matchesStatus = (item.costoPromedio || 0) > 100; // Example threshold
        }

        return matchesSearch && matchesStatus;
    });

    const handleDownloadPDF = () => {
        const almacenNombre = almacenes.find(a => a.idAlmacen === selectedAlmacen)?.nombre || 'General';
        generateInventoryPDF(filteredStock, almacenNombre); // Generate based on filtered view
        alertSuccess('Reporte generado exitosamente');
    };

    return (
        <div style={{ animation: 'fadeIn 0.3s' }}>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                gap: '20px',
                marginBottom: '30px'
            }}>
                <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '5px' }}>Total SKUs</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stock.length}</div>
                </div>
                <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '5px' }}>Almacenes Activos</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800 }}>{almacenes.length}</div>
                </div>
                <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '5px' }}>Valor Inventario (Est.)</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.5px' }}>
                        ${((filteredStock.reduce((acc, i: any) => acc + ((i.stockActual || 0) * (i.costoPromedio || 0)), 0)) / 1000).toFixed(1)}k
                    </div>
                </div>
            </div>

            {/* Quick Filters & Search Bar */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: 1, position: 'relative', minWidth: '250px' }}>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="🔍 Buscar por código, nombre, categoría..."
                        value={filterQuery}
                        onChange={e => setFilterQuery(e.target.value)}
                        style={{ paddingLeft: '15px' }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        className={`btn-secondary ${filterStatus === 'ALL' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('ALL')}
                        style={{ background: filterStatus === 'ALL' ? 'var(--primary)' : undefined, color: filterStatus === 'ALL' ? '#fff' : undefined }}
                    >
                        Todos
                    </button>
                    <button
                        className={`btn-secondary ${filterStatus === 'LOW_STOCK' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('LOW_STOCK')}
                        style={{
                            background: filterStatus === 'LOW_STOCK' ? 'rgba(239, 68, 68, 0.2)' : undefined,
                            color: filterStatus === 'LOW_STOCK' ? '#fca5a5' : '#f87171',
                            borderColor: '#ef4444'
                        }}
                    >
                        ⚠️ Bajo Stock ({stock.filter((i: any) => (i.stockActual || 0) <= (i.minimo || 5)).length})
                    </button>
                    <button
                        className={`btn-secondary ${filterStatus === 'HIGH_VALUE' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('HIGH_VALUE')}
                        style={{ background: filterStatus === 'HIGH_VALUE' ? '#fff' : undefined, color: '#333' }}
                    >
                        💎 Alto Valor
                    </button>
                    <button
                        className="btn-secondary"
                        onClick={handleDownloadPDF}
                        title="Descargar Vista Actual"
                        style={{ marginLeft: '10px' }}
                    >
                        <FileText size={18} /> PDF
                    </button>
                </div>
            </div>

            <DataTable
                title={selectedAlmacen ? `Stock: ${almacenes.find(a => a.idAlmacen.toString() === selectedAlmacen)?.nombre} ` : "Inventario Consolidado"}
                description="Control total de existencias por almacén y propietario."
                columns={columns}
                data={filteredStock}  // Using filtered data
                loading={loading}
                allowExport={false} // We handle export manually now
                actions={
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 200px' }}>
                            <label style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700 }}>Filtrar Almacén</label>
                            <select
                                className="form-input"
                                value={selectedAlmacen}
                                onChange={(e) => setSelectedAlmacen(e.target.value)}
                                style={{
                                    padding: '8px 12px',
                                    background: '#1a1a1a',
                                    border: '1px solid var(--border)',
                                    color: '#fff',
                                    borderRadius: '6px',
                                    fontSize: '0.85rem',
                                    width: '100%'
                                }}
                            >
                                <option value="">Todos los Almacenes</option>
                                {almacenes.map(alm => (
                                    <option key={alm.idAlmacen} value={alm.idAlmacen}>{alm.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignSelf: 'flex-end' }}>
                            {(isAdmin || isBodega) && (
                                <>
                                    <button className="btn-primary" style={{ padding: '8px 12px', fontSize: '0.85rem' }} onClick={() => setShowEntryModal(true)}>Entrada</button>
                                    <button className="btn-secondary" style={{ padding: '8px 12px', fontSize: '0.85rem' }} onClick={() => setShowImportModal(true)}>Excel</button>
                                </>
                            )}
                            <button className="btn-secondary" style={{ padding: '8px 12px', fontSize: '0.85rem' }} onClick={() => fetchStock(selectedAlmacen)}>🔄</button>
                        </div>
                    </div>
                }
            />

            {/* Modal Historial */}
            <Modal
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                title={`Línea de Vida del Producto`}
                width="800px"
            >
                {selectedItem && (
                    <div style={{ marginBottom: '20px' }}>
                        <h4 style={{ color: 'var(--primary)', marginBottom: '5px' }}>{selectedItem.productoNombre}</h4>
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', gap: '15px' }}>
                            <span>Código: {selectedItem.productoCodigo}</span>
                            <span>Almacén Actual: {selectedItem.almacenNombre}</span>
                        </div>
                    </div>
                )}

                {loadingKardex ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                        <div>Cargando historia...</div>
                    </div>
                ) : (
                    <KardexTimeline movimientos={kardex} />
                )}
            </Modal>

            {/* Modal de Entrada Manual */}
            <Modal
                isOpen={showEntryModal}
                onClose={() => setShowEntryModal(false)}
                title="Registrar Entrada de Mercancía"
                width="600px"
            >
                <div style={{ display: 'flex', gap: '10px', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                    <button
                        className={`tab - btn ${entryType === 'EMPRESA' ? 'active' : ''} `}
                        style={{ flex: 1, justifyContent: 'center' }}
                        onClick={() => setEntryType('EMPRESA')}
                    >
                        Compra Propia
                    </button>
                    <button
                        className={`tab - btn ${entryType === 'PROVEEDOR' ? 'active' : ''} `}
                        style={{ flex: 1, justifyContent: 'center' }}
                        onClick={() => setEntryType('PROVEEDOR')}
                    >
                        Consignación
                    </button>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '15px'
                }}>
                    <div className="form-group">
                        <label className="form-label">Almacén Destino</label>
                        <select className="form-input" value={entryForm.almacenId} onChange={e => setEntryForm({ ...entryForm, almacenId: e.target.value })}>
                            {almacenes.map(alm => <option key={alm.idAlmacen} value={alm.idAlmacen}>{alm.nombre}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Producto</label>
                        <select className="form-input" value={entryForm.productoId} onChange={e => setEntryForm({ ...entryForm, productoId: e.target.value })}>
                            <option value="">Seleccionar</option>
                            {productos.map(p => <option key={p.idProducto} value={p.idProducto}>{p.codigo} - {p.nombre}</option>)}
                        </select>
                    </div>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '15px'
                }}>
                    <div className="form-group">
                        <label className="form-label">Cantidad a Ingresar</label>
                        <input type="number" className="form-input" min="1" value={entryForm.cantidad} onChange={e => setEntryForm({ ...entryForm, cantidad: Number(e.target.value) })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Costo Unitario ($)</label>
                        <input type="number" className="form-input" min="0" step="0.01" value={entryForm.costoUnitario} onChange={e => setEntryForm({ ...entryForm, costoUnitario: Number(e.target.value) })} />
                    </div>
                </div>

                {entryType === 'PROVEEDOR' && (
                    <div className="form-group animate-fade">
                        <label className="form-label">Proveedor Propietario</label>
                        <select className="form-input" value={entryForm.proveedorId} onChange={e => setEntryForm({ ...entryForm, proveedorId: e.target.value })}>
                            <option value="">Seleccionar Proveedor</option>
                            {proveedores.map(prov => <option key={prov.idProveedor} value={prov.idProveedor}>{prov.nombre}</option>)}
                        </select>
                    </div>
                )}

                <div className="form-group">
                    <label className="form-label">Notas / Referencia</label>
                    <textarea className="form-input" rows={2} placeholder="N° Factura, Orden de Compra..." value={entryForm.notas} onChange={e => setEntryForm({ ...entryForm, notas: e.target.value })} />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button className="btn-secondary" onClick={() => setShowEntryModal(false)} disabled={processing}>Cancelar</button>
                    <button className="btn-primary" onClick={handleRegisterEntry} disabled={processing}>{processing ? 'Registrando...' : 'Registrar'}</button>
                </div>
            </Modal>

            {/* Modal Importación Excel */}
            <Modal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                title="Carga Masiva de Stock (Excel)"
                width="500px"
                footer={<>
                    <button className="btn-secondary" onClick={() => setShowImportModal(false)} disabled={uploading}>Cancelar</button>
                    <button className="btn-primary" onClick={handleImportExcel} disabled={uploading || !importFile}>
                        {uploading ? 'Procesando...' : 'Subir y Procesar'}
                    </button>
                </>}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="alert alert-info" style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '10px', borderRadius: '5px', fontSize: '0.9rem' }}>
                        El archivo debe tener las columnas: <b>Codigo, Cantidad</b>, Costo (opcional).
                        <br />Se generará una entrada de inventario masiva.
                    </div>

                    <div>
                        <label className="form-label">Almacén Destino</label>
                        <select
                            className="form-input"
                            value={targetAlmacen}
                            onChange={(e) => setTargetAlmacen(e.target.value)}
                        >
                            {almacenes.length > 0 ? (
                                almacenes.map(alm => (
                                    <option key={alm.idAlmacen} value={alm.idAlmacen}>{alm.nombre}</option>
                                ))
                            ) : (
                                <option value="">Cargando almacenes...</option>
                            )}
                        </select>
                    </div>

                    <div>
                        <label className="form-label">Archivo (.xlsx)</label>
                        <div style={{ border: '2px dashed var(--border)', padding: '20px', textAlign: 'center', borderRadius: '10px' }}>
                            <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} style={{ color: '#fff' }} />
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
