import * as XLSX from 'xlsx';
import { useState, useEffect, useMemo } from 'react';
import { invService } from '../../services/api.service';
import { alertSuccess, alertError } from '../../services/alert.service';
import { DataTable } from '../../components/DataTable';
import { Modal } from '../../components/Modal';
import { generateInventoryPDF } from '../../utils/pdfGenerator';
import { FileText, Warehouse } from 'lucide-react';
import { KardexTimeline } from './components/KardexTimeline';
import { SidePanel } from '../../components/SidePanel';

export const InventarioView = () => {
    const [stock, setStock] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [kardex, setKardex] = useState([]);
    const [loadingKardex, setLoadingKardex] = useState(false);
    const [user, setUser] = useState<any>(null);

    const [showMyStock, setShowMyStock] = useState(false);

    useEffect(() => {
        const u = localStorage.getItem('inv_user');
        if (u) {
            const parsed = JSON.parse(u);
            setUser(parsed);
            if (parsed.rolNombre?.toUpperCase().includes('TECNICO')) {
                setShowMyStock(true);
            }
        }
    }, []);

    const isAdmin = user?.rolNombre === 'ADMIN' || user?.rolNombre === 'Administrador';
    const isBodega = user?.rolNombre === 'BODEGA' || user?.rolNombre === 'Bodega';

    const [almacenes, setAlmacenes] = useState<any[]>([]);
    const [selectedAlmacen, setSelectedAlmacen] = useState<string>('');
    const [productos, setProductos] = useState<any[]>([]);

    const [showImportModal, setShowImportModal] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [targetAlmacen, setTargetAlmacen] = useState('');
    const [uploading, setUploading] = useState(false);

    const [showEntryModal, setShowEntryModal] = useState(false);
    const [entryForm, setEntryForm] = useState({
        almacenId: '',
        productoId: '',
        cantidad: 1,
        notas: ''
    });

    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [showProductDropdown, setShowProductDropdown] = useState(false);

    const [previewData, setPreviewData] = useState<any[]>([]);
    const [showPreview, setShowPreview] = useState(false);
    const [filterQuery, setFilterQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');

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
            const [resAlm, resProd] = await Promise.all([
                invService.getAlmacenes(),
                invService.getCatalog('productos')
            ]);

            const alms = resAlm.data.data || resAlm.data || [];
            setAlmacenes(alms);
            setProductos(resProd.data.data || resProd.data || []);

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

    const filteredStock = useMemo(() => {
        const myStoreIds = almacenes.filter(a => a.idResponsable === user?.idUsuario).map(a => a.idAlmacen);

        return stock.filter((item: any) => {
            const searchTerms = filterQuery.toLowerCase().split(' ');
            const itemText = `${item.productoCodigo} ${item.productoNombre} ${item.categoria || ''} ${item.almacenNombre}`.toLowerCase();
            const matchesSearch = searchTerms.every(term => itemText.includes(term));

            let matchesStatus = true;
            if (filterStatus === 'LOW_STOCK') {
                matchesStatus = (item.stockActual || 0) <= (item.minimo || 5);
            } else if (filterStatus === 'HIGH_VALUE') {
                matchesStatus = (item.costoPromedio || 0) > 100;
            }

            if (showMyStock) {
                // Filter by owned warehouse or "movil" name convetion
                const matchesId = myStoreIds.includes(item.almacenId);
                const matchesName = item.almacenNombre?.toLowerCase().includes('movil') || item.almacenNombre?.toLowerCase().includes('tecnico');
                matchesStatus = matchesStatus && (matchesId || matchesName);
            }

            return matchesSearch && matchesStatus;
        });
    }, [stock, filterQuery, filterStatus, showMyStock, almacenes, user]);

    const handleSaveAllItems = async () => {
        if (!entryForm.productoId || entryForm.cantidad <= 0) return alertError('Seleccione producto y cantidad válida');

        try {
            await invService.registrarMovimiento({
                tipoMovimiento: 'ENTRADA',
                almacenDestinoId: parseInt(entryForm.almacenId),
                notas: entryForm.notas || 'Ingreso manual',
                detalles: [{
                    productoId: parseInt(entryForm.productoId),
                    cantidad: entryForm.cantidad,
                    propietarioTipo: 'EMPRESA',
                    proveedorId: 0,
                    costoUnitario: 0
                }]
            });
            alertSuccess(`Producto ingresado correctamente`);
            setShowEntryModal(false);
            fetchStock(selectedAlmacen);
            setEntryForm(prev => ({ ...prev, cantidad: 1, notas: '', productoId: '' }));
            setProductSearchTerm('');
        } catch (err) {
            alertError('Error al registrar entrada');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setImportFile(file);

            const reader = new FileReader();
            reader.onload = (evt) => {
                const data = evt.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet);

                const validated = jsonData.map((row: any, idx: number) => {
                    const errors: string[] = [];
                    const codigo = row.Codigo || row.codigo || row.CODIGO || '';
                    const cantidad = parseFloat(row.Cantidad || row.cantidad || row.CANTIDAD || 0);

                    if (!codigo) errors.push('Código vacío');
                    if (isNaN(cantidad) || cantidad <= 0) errors.push('Cantidad inválida');

                    const producto = productos.find(p => p.codigo === codigo);
                    if (!producto && codigo) errors.push('Producto no encontrado');

                    return {
                        fila: idx + 2,
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
    };

    const handleDownloadPDF = () => {
        const almacenNombre = almacenes.find(a => a.idAlmacen === selectedAlmacen)?.nombre || 'General';
        generateInventoryPDF(filteredStock, almacenNombre);
        alertSuccess('Reporte generado exitosamente');
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

    return (
        <div style={{ animation: 'fadeIn 0.3s' }}>
            {/* ... Summary Cards ... */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                gap: '20px',
                marginBottom: '30px'
            }}>
                <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '5px' }}>Total SKUs</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800 }}>{filteredStock.length}</div>
                </div>
                <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '5px' }}>Almacenes Visualizados</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800 }}>
                        {selectedAlmacen ? 1 : (showMyStock ? 'Mis Bodegas' : almacenes.length)}
                    </div>
                </div>
                <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '5px' }}>Valor Inventario (Est.)</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.5px' }}>
                        ${((filteredStock.reduce((acc, i: any) => acc + ((i.stockActual || 0) * (i.costoPromedio || 0)), 0)) / 1000).toFixed(1)}k
                    </div>
                </div>
            </div>

            {/* Quick Filters */}
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
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <div style={{ borderRight: '1px solid #444', paddingRight: '10px', marginRight: '5px' }}>
                        <button
                            className={`btn-secondary ${showMyStock ? 'active' : ''}`}
                            style={{ background: showMyStock ? 'var(--accent)' : '' }}
                            onClick={() => setShowMyStock(!showMyStock)}
                        >
                            <Warehouse size={18} style={{ marginRight: '5px' }} />
                            {showMyStock ? 'Mi Bodega (Activo)' : 'Ver Mi Bodega'}
                        </button>
                    </div>

                    <button className={`btn-secondary ${filterStatus === 'ALL' ? 'active' : ''}`} onClick={() => setFilterStatus('ALL')}>Todos</button>
                    <button className={`btn-secondary ${filterStatus === 'LOW_STOCK' ? 'active' : ''}`} onClick={() => setFilterStatus('LOW_STOCK')}>⚠️ Bajo Stock</button>
                    <button className={`btn-secondary ${filterStatus === 'HIGH_VALUE' ? 'active' : ''}`} onClick={() => setFilterStatus('HIGH_VALUE')}>💎 Alto Valor</button>
                    <button className="btn-secondary" onClick={handleDownloadPDF}><FileText size={18} /> PDF</button>
                </div>
            </div>

            <DataTable
                title={showMyStock ? "📦 Mi Bodega / Stock Personal" : (selectedAlmacen ? `Stock: ${almacenes.find(a => a.idAlmacen.toString() === selectedAlmacen)?.nombre} ` : "Inventario Consolidado")}
                description={showMyStock ? "Gestiona el material que tienes asignado en tu unidad o custodia." : "Control total de existencias por almacén y propietario."}
                columns={columns}
                data={filteredStock}
                loading={loading}
                allowExport={false}
                actions={
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {!showMyStock && (
                            <select
                                className="form-input"
                                value={selectedAlmacen}
                                onChange={(e) => setSelectedAlmacen(e.target.value)}
                                style={{ width: '200px' }}
                            >
                                <option value="">Todos los Almacenes</option>
                                {almacenes.map(alm => <option key={alm.idAlmacen} value={alm.idAlmacen}>{alm.nombre}</option>)}
                            </select>
                        )}
                        {(isAdmin || isBodega) && (
                            <>
                                <button className="btn-primary" onClick={() => setShowEntryModal(true)}>Entrada</button>
                                <button className="btn-secondary" onClick={() => setShowImportModal(true)}>Excel</button>
                            </>
                        )}
                        <button className="btn-secondary" onClick={() => fetchStock(selectedAlmacen)}>🔄</button>
                    </div>
                }
            />

            {/* Optimized Render: Only render modals when open */}
            {selectedItem && (
                <SidePanel
                    isOpen={!!selectedItem}
                    onClose={() => setSelectedItem(null)}
                    title="Línea de Vida del Producto"
                    width="600px"
                >
                    <div style={{ marginBottom: '30px', background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px' }}>
                        <h4 style={{ color: '#fff', marginBottom: '8px', fontSize: '1.1rem' }}>{selectedItem.productoNombre}</h4>
                        <div style={{ display: 'flex', gap: '20px', fontSize: '0.9rem', color: '#94a3b8' }}>
                            <div>SKU: {selectedItem.productoCodigo}</div>
                            <div>Stock: {selectedItem.cantidad}</div>
                        </div>
                    </div>
                    {loadingKardex ? <div>Cargando...</div> : <KardexTimeline movimientos={kardex} />}
                </SidePanel>
            )}

            {showEntryModal && (
                <Modal
                    isOpen={showEntryModal}
                    onClose={() => setShowEntryModal(false)}
                    title="Registrar Entrada de Mercancía"
                    width="600px"
                >
                    <div className="form-group">
                        <label>Almacén Destino</label>
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
                        {/* Simplified Dropdown Logic for rewriting context */}
                        {showProductDropdown && (
                            <div style={{ maxHeight: '200px', overflowY: 'auto', background: '#1a1a1a', border: '1px solid var(--border)' }}>
                                {productos
                                    .filter(p => p.codigo?.includes(productSearchTerm) || p.nombre?.toLowerCase().includes(productSearchTerm.toLowerCase()))
                                    .slice(0, 10) // Limit results
                                    .map(p => (
                                        <div key={p.idProducto} onClick={() => {
                                            setEntryForm(prev => ({ ...prev, productoId: p.idProducto }));
                                            setProductSearchTerm(`${p.codigo} - ${p.nombre}`);
                                            setShowProductDropdown(false);
                                        }} style={{ padding: '8px', borderBottom: '1px solid #333', cursor: 'pointer' }}>
                                            {p.nombre}
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '15px' }}>
                        <button className="btn-secondary" onClick={() => setShowEntryModal(false)}>Cancelar</button>
                        <button className="btn-primary" onClick={handleSaveAllItems}>Guardar</button>
                    </div>
                </Modal>
            )}

            {showImportModal && (
                <Modal isOpen={showImportModal} onClose={() => setShowImportModal(false)} title="Importar Excel">
                    <input type="file" accept=".xlsx" onChange={handleFileChange} />
                    <button className="btn-primary" onClick={handleImportExcel} disabled={uploading}>Subir</button>
                </Modal>
            )}

            {showPreview && (
                <Modal isOpen={showPreview} onClose={() => setShowPreview(false)} title="Previsualización" width="800px">
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <table>
                            <thead><tr><th>Código</th><th>Producto</th><th>Cant</th><th>Estado</th></tr></thead>
                            <tbody>
                                {previewData.map((r, i) => (
                                    <tr key={i}><td>{r.codigo}</td><td>{r.productoNombre}</td><td>{r.cantidad}</td><td>{r.errors.join(', ') || 'OK'}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <button className="btn-primary" onClick={async () => {
                        const itemsToImport = previewData.filter(r => r.incluir && r.errors.length === 0);
                        if (itemsToImport.length === 0) return alertError('No hay items válidos');
                        setUploading(true);
                        try {
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
                            alertSuccess('Importación completada');
                            setShowPreview(false);
                            setShowImportModal(false);
                            fetchStock();
                        } catch (e) { alertError('Error importando'); } finally { setUploading(false); }
                    }}>Confirmar Importación</button>
                </Modal>
            )}
        </div>
    );
};
