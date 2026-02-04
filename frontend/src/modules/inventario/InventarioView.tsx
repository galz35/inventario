import * as XLSX from 'xlsx';
import { useState, useEffect } from 'react';
import { invService } from '../../services/api.service';
import { alertSuccess, alertError } from '../../services/alert.service';
import { DataTable } from '../../components/DataTable';
import { Modal } from '../../components/Modal';
import { generateInventoryPDF } from '../../utils/pdfGenerator';
import { FileText } from 'lucide-react';
import { KardexTimeline } from './components/KardexTimeline';
import { SidePanel } from '../../components/SidePanel';

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

    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [showProductDropdown, setShowProductDropdown] = useState(false);

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

            setAlmacenes(alms);
            setProductos(resProd.data.data || resProd.data || []);
            setProveedores(resProv.data.data || resProv.data || []);

            if (alms.length > 0) {
                setTargetAlmacen(alms[0].idAlmacen);
                setEntryForm(prev => ({ ...prev, almacenId: alms[0].idAlmacen }));
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

    // Master-Detail State
    const [entryItems, setEntryItems] = useState<{
        productoId: string;
        productoNombre: string;
        cantidad: number;
        costoUnitario: number;
    }[]>([]);

    const handleAddItemToList = () => {
        if (!entryForm.productoId || entryForm.cantidad <= 0) {
            return alertError('Seleccione producto y cantidad válida');
        }

        const producto = productos.find(p => p.idProducto.toString() === entryForm.productoId);
        if (!producto) return;

        setEntryItems(prev => [...prev, {
            productoId: entryForm.productoId,
            productoNombre: `${producto.codigo} - ${producto.nombre}`,
            cantidad: entryForm.cantidad,
            costoUnitario: entryForm.costoUnitario
        }]);

        // Clean fields for next item
        setEntryForm(prev => ({ ...prev, cantidad: 1, costoUnitario: 0, productoId: '' }));
        setProductSearchTerm('');
    };

    const handleRemoveItem = (index: number) => {
        setEntryItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleSaveAllItems = async () => {
        if (entryItems.length === 0) return alertError('Agregue al menos un producto');
        if (entryType === 'PROVEEDOR' && !entryForm.proveedorId) return alertError('Seleccione proveedor');

        setProcessing(true);
        try {
            await invService.registrarMovimiento({
                tipoMovimiento: 'ENTRADA',
                almacenDestinoId: parseInt(entryForm.almacenId),
                notas: entryForm.notas || 'Ingreso múltiple',
                detalles: entryItems.map(item => ({
                    productoId: parseInt(item.productoId),
                    cantidad: item.cantidad,
                    propietarioTipo: entryType,
                    proveedorId: entryType === 'PROVEEDOR' ? parseInt(entryForm.proveedorId) : 0,
                    costoUnitario: item.costoUnitario
                }))
            });
            alertSuccess(`${entryItems.length} productos ingresados correctamente`);
            setShowEntryModal(false);
            setEntryItems([]);
            fetchStock(selectedAlmacen);
            // Reset form completely
            setEntryForm(prev => ({ ...prev, cantidad: 1, notas: '', productoId: '', costoUnitario: 0 }));
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

    // Excel Preview State
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [showPreview, setShowPreview] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setImportFile(file);

            // Parsear Excel para preview
            const reader = new FileReader();
            reader.onload = (evt) => {
                const data = evt.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet);

                // Validar cada fila
                const validated = jsonData.map((row: any, idx: number) => {
                    const errors: string[] = [];
                    const codigo = row.Codigo || row.codigo || row.CODIGO || '';
                    const cantidad = parseFloat(row.Cantidad || row.cantidad || row.CANTIDAD || 0);

                    if (!codigo) errors.push('Código vacío');
                    if (isNaN(cantidad) || cantidad <= 0) errors.push('Cantidad inválida');

                    // Verificar si producto existe
                    const producto = productos.find(p => p.codigo === codigo);
                    if (!producto && codigo) errors.push('Producto no encontrado');

                    return {
                        fila: idx + 2, // +2 por header y base-1
                        codigo,
                        cantidad,
                        productoNombre: producto?.nombre || '???',
                        errors,
                        incluir: errors.length === 0
                    };
                });

                setPreviewData(validated);
                setShowPreview(true);
            };
            reader.readAsBinaryString(file);
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

            {/* Drawer Historial */}
            <SidePanel
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                title="Línea de Vida del Producto"
                width="600px"
                footer={
                    <button className="btn-secondary" onClick={() => setSelectedItem(null)}>
                        Cerrar Panel
                    </button>
                }
            >
                {selectedItem && (
                    <div style={{ marginBottom: '30px', background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px' }}>
                        <h4 style={{ color: '#fff', marginBottom: '8px', fontSize: '1.1rem' }}>{selectedItem.productoNombre}</h4>
                        <div style={{ display: 'flex', gap: '20px', fontSize: '0.9rem', color: '#94a3b8' }}>
                            <div>
                                <span style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '1px', marginBottom: '4px' }}>SKU Código</span>
                                <code style={{ background: '#0f172a', padding: '4px 8px', borderRadius: '4px', color: '#e2e8f0' }}>{selectedItem.productoCodigo}</code>
                            </div>
                            <div>
                                <span style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '1px', marginBottom: '4px' }}>Ubicación</span>
                                <span style={{ color: '#e2e8f0' }}>{selectedItem.almacenNombre}</span>
                            </div>
                            <div>
                                <span style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '1px', marginBottom: '4px' }}>Stock Actual</span>
                                <span style={{ color: '#10b981', fontWeight: 700 }}>{selectedItem.cantidad} {selectedItem.unidad}</span>
                            </div>
                        </div>
                    </div>
                )}

                {loadingKardex ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                        <div className="spinner" style={{ margin: '0 auto 10px' }}></div>
                        <div>Rastreando historia...</div>
                    </div>
                ) : (
                    <KardexTimeline movimientos={kardex} />
                )}
            </SidePanel>

            {/* Modal de Entrada Manual */}
            <Modal
                isOpen={showEntryModal}
                onClose={() => setShowEntryModal(false)}
                title="Registrar Entrada de Mercancía"
                width="600px"
            >
                <div className="form-group">
                    <label className="form-label">Tipo de Entrada</label>
                    <select
                        className="form-input"
                        value={entryType}
                        onChange={(e) => setEntryType(e.target.value)}
                    >
                        <option value="EMPRESA">Compra Propia</option>
                        <option value="PROVEEDOR">Consignación</option>
                    </select>
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
                    <div className="form-group" style={{ position: 'relative' }}>
                        <label className="form-label">Producto</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Buscar código o nombre..."
                            value={productSearchTerm}
                            onChange={e => {
                                setProductSearchTerm(e.target.value);
                                setShowProductDropdown(true);
                                setEntryForm(prev => ({ ...prev, productoId: '' }));
                            }}
                            onFocus={() => setShowProductDropdown(true)}
                        />
                        {showProductDropdown && (
                            <>
                                <div
                                    style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 99 }}
                                    onClick={() => setShowProductDropdown(false)}
                                />
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                    background: '#1a1a1a',
                                    border: '1px solid var(--border)',
                                    borderRadius: '0 0 6px 6px',
                                    zIndex: 100,
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                                }}>
                                    {productos
                                        .filter(p => {
                                            const term = productSearchTerm.toLowerCase();
                                            return p.codigo.toLowerCase().includes(term) ||
                                                p.nombre.toLowerCase().includes(term);
                                        })
                                        .map(p => (
                                            <div
                                                key={p.idProducto}
                                                onClick={() => {
                                                    setEntryForm(prev => ({ ...prev, productoId: p.idProducto }));
                                                    setProductSearchTerm(`${p.codigo} - ${p.nombre}`);
                                                    setShowProductDropdown(false);
                                                }}
                                                style={{
                                                    padding: '10px 12px',
                                                    cursor: 'pointer',
                                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <span style={{ fontSize: '0.9rem' }}>{p.nombre}</span>
                                                <code style={{ fontSize: '0.75rem', color: 'var(--primary)', background: 'rgba(255,255,255,0.05)', padding: '2px 4px', borderRadius: '3px' }}>{p.codigo}</code>
                                            </div>
                                        ))}
                                    {productos.filter(p => p.codigo.toLowerCase().includes(productSearchTerm.toLowerCase()) || p.nombre.toLowerCase().includes(productSearchTerm.toLowerCase())).length === 0 && (
                                        <div style={{ padding: '12px', color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.9rem' }}>No se encontraron productos</div>
                                    )}
                                </div>
                            </>
                        )}
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
                        <label className="form-label">Costo Unitario ($) <span style={{ fontSize: '0.7em', color: 'var(--text-secondary)' }}>(Opcional)</span></label>
                        <input
                            type="number"
                            className="form-input"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={entryForm.costoUnitario === 0 ? '' : entryForm.costoUnitario}
                            onChange={e => setEntryForm({ ...entryForm, costoUnitario: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                        />
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

                {/* Lista de Items Agregados */}
                {entryItems.length > 0 && (
                    <div style={{ marginTop: '20px', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                        <div style={{ background: '#1a1a1a', padding: '10px 15px', fontWeight: 600, fontSize: '0.85rem' }}>
                            📦 Productos a Ingresar ({entryItems.length})
                        </div>
                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {entryItems.map((item, idx) => (
                                <div key={idx} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '10px 15px',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{item.productoNombre}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                            Cant: {item.cantidad} | ${item.costoUnitario.toFixed(2)} c/u
                                        </div>
                                    </div>
                                    <button
                                        className="btn-danger"
                                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                        onClick={() => handleRemoveItem(idx)}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div style={{ background: '#1a1a1a', padding: '10px 15px', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Total Items: <b>{entryItems.length}</b></span>
                            <span>Valor Total: <b style={{ color: 'var(--primary)' }}>
                                ${entryItems.reduce((sum, i) => sum + (i.cantidad * i.costoUnitario), 0).toFixed(2)}
                            </b></span>
                        </div>
                    </div>
                )}

                <div className="form-group" style={{ marginTop: '15px' }}>
                    <label className="form-label">Notas / Referencia</label>
                    <textarea className="form-input" rows={2} placeholder="N° Factura, Orden de Compra..." value={entryForm.notas} onChange={e => setEntryForm({ ...entryForm, notas: e.target.value })} />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '15px' }}>
                    <button className="btn-secondary" onClick={() => handleAddItemToList()} disabled={processing}>
                        + Agregar a Lista
                    </button>
                    <button className="btn-secondary" onClick={() => { setShowEntryModal(false); setEntryItems([]); }} disabled={processing}>
                        Cancelar
                    </button>
                    <button className="btn-primary" onClick={handleSaveAllItems} disabled={processing || entryItems.length === 0}>{processing ? 'Guardando...' : `Guardar ${entryItems.length} Items`}</button>
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

            {/* Modal Preview Excel */}
            <Modal
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                title="Vista Previa de Importación"
                width="800px"
            >
                <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Total filas: <b>{previewData.length}</b></span>
                    <span style={{ color: '#10b981' }}>
                        Válidas: <b>{previewData.filter(r => r.errors.length === 0).length}</b>
                    </span>
                    <span style={{ color: '#ef4444' }}>
                        Con errores: <b>{previewData.filter(r => r.errors.length > 0).length}</b>
                    </span>
                </div>

                <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ background: '#1a1a1a', position: 'sticky', top: 0 }}>
                                <th style={{ padding: '10px', textAlign: 'left' }}>Incluir</th>
                                <th style={{ padding: '10px', textAlign: 'left' }}>Fila</th>
                                <th style={{ padding: '10px', textAlign: 'left' }}>Código</th>
                                <th style={{ padding: '10px', textAlign: 'left' }}>Producto</th>
                                <th style={{ padding: '10px', textAlign: 'right' }}>Cantidad</th>
                                <th style={{ padding: '10px', textAlign: 'left' }}>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {previewData.map((row, idx) => (
                                <tr key={idx} style={{
                                    background: row.errors.length > 0 ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    <td style={{ padding: '8px 10px' }}>
                                        <input
                                            type="checkbox"
                                            checked={row.incluir}
                                            onChange={() => {
                                                const updated = [...previewData];
                                                updated[idx].incluir = !updated[idx].incluir;
                                                setPreviewData(updated);
                                            }}
                                            disabled={row.errors.length > 0}
                                        />
                                    </td>
                                    <td style={{ padding: '8px 10px' }}>{row.fila}</td>
                                    <td style={{ padding: '8px 10px' }}><code>{row.codigo}</code></td>
                                    <td style={{ padding: '8px 10px' }}>{row.productoNombre}</td>
                                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{row.cantidad}</td>
                                    <td style={{ padding: '8px 10px' }}>
                                        {row.errors.length === 0 ? (
                                            <span style={{ color: '#10b981' }}>✓ OK</span>
                                        ) : (
                                            <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>
                                                {row.errors.join(', ')}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                    <button className="btn-secondary" onClick={() => setShowPreview(false)}>Cancelar</button>
                    <button
                        className="btn-primary"
                        onClick={async () => {
                            const itemsToImport = previewData.filter(r => r.incluir && r.errors.length === 0);
                            if (itemsToImport.length === 0) return alertError('No hay items válidos');

                            setUploading(true);
                            try {
                                // Enviar solo items válidos
                                await invService.registrarMovimiento({
                                    tipoMovimiento: 'ENTRADA_CARGA_MASIVA',
                                    almacenDestinoId: parseInt(targetAlmacen),
                                    notas: 'Importación Excel con validación',
                                    detalles: itemsToImport.map(item => {
                                        const prod = productos.find(p => p.codigo === item.codigo);
                                        return {
                                            productoId: prod?.idProducto,
                                            cantidad: item.cantidad,
                                            propietarioTipo: 'EMPRESA',
                                            proveedorId: 0,
                                            costoUnitario: 0
                                        };
                                    })
                                });
                                alertSuccess(`${itemsToImport.length} productos importados`);
                                setShowPreview(false);
                                setShowImportModal(false);
                                setPreviewData([]);
                                fetchStock();
                            } catch (err) {
                                alertError('Error en importación');
                            } finally {
                                setUploading(false);
                            }
                        }}
                        disabled={uploading || previewData.filter(r => r.incluir).length === 0}
                    >
                        {uploading ? 'Importando...' : `Importar ${previewData.filter(r => r.incluir).length} Items`}
                    </button>
                </div>
            </Modal>
        </div>
    );
};
