import { useState, useEffect } from 'react';
import { invService } from '../../services/api.service';
import { alertSuccess, alertError } from '../../services/alert.service';
import { Modal } from '../../components/Modal';
import { DataTable } from '../../components/DataTable';

export const TransferenciasView = () => {
    const [almacenes, setAlmacenes] = useState<any[]>([]);
    const [transferencias, setTransferencias] = useState<any[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingList, setLoadingList] = useState(true);
    const [user, setUser] = useState<any>(null);

    const [transferData, setTransferData] = useState({
        almacenOrigenId: '',
        almacenDestinoId: '',
        notas: '',
        detalles: [] as any[]
    });

    const [availableStock, setAvailableStock] = useState<any[]>([]);
    const [selectedProducto, setSelectedProducto] = useState('');
    const [cantidad, setCantidad] = useState(1);

    // Normalize Role Check
    const isTecnico = user?.rolNombre?.toUpperCase() === 'TECNICO';

    useEffect(() => {
        const u = localStorage.getItem('inv_user');
        if (u) {
            const parsed = JSON.parse(u);
            setUser(parsed);
            fetchTransferencias(parsed);
        }
        fetchAlmacenes();
    }, []);

    const fetchAlmacenes = async () => {
        try {
            const res = await invService.getAlmacenes();
            setAlmacenes(res.data.data || res.data || []);
        } catch (e) {
            // fail silent
        }
    };

    const fetchTransferencias = async (currentUser?: any) => {
        const activeUser = currentUser || user;
        setLoadingList(true);
        try {
            const res = await (invService as any).getTransferencias();
            let data = res.data.data || res.data || [];

            const role = (activeUser?.rolNombre || '').toUpperCase();
            if (role === 'TECNICO') {
                data = data.filter((t: any) =>
                    t.almacenDestinoId === activeUser.idAlmacenTecnico ||
                    t.almacenOrigenId === activeUser.idAlmacenTecnico
                );
            }
            setTransferencias(data);
        } catch (e: any) {
            if (e.response && e.response.status === 401) return;
            console.error(e);
        } finally {
            setLoadingList(false);
        }
    };

    const fetchStockOrigen = async (id: string) => {
        if (!id) return setAvailableStock([]);
        try {
            const res = await invService.getStock({ almacenId: id });
            setAvailableStock(res.data.data || res.data || []);
        } catch (e) {
            console.error(e);
        }
    };

    const handleOpenCreate = () => {
        if (isTecnico && user.idAlmacenTecnico) {
            // If technician has no explicit origin warehouse assigned, default to 1 (Central) or handle gracefully
            const originId = user.idAlmacen?.toString() || '1';
            setTransferData({
                almacenOrigenId: originId,
                almacenDestinoId: user.idAlmacenTecnico?.toString() || '',
                notas: 'Solicitud de reposición para cuadrilla',
                detalles: []
            });
            fetchStockOrigen(originId);
        } else {
            setTransferData({ almacenOrigenId: '', almacenDestinoId: '', notas: '', detalles: [] });
            setAvailableStock([]); // Clear previous stock
        }
        setShowCreateModal(true);
    };

    const addItem = () => {
        if (!selectedProducto || cantidad <= 0) return alertError('Seleccione producto y cantidad válida');
        if (!Number.isInteger(cantidad)) return alertError('La cantidad debe ser un número entero');

        const prod = availableStock.find(p => p.productoId.toString() === selectedProducto);
        if (!prod) return;

        if (prod.cantidad < cantidad) return alertError(`Stock insuficiente en origen (Disp: ${prod.cantidad})`);
        if (transferData.detalles.some(d => d.productoId === prod.productoId)) return alertError('El producto ya está en la lista');

        setTransferData(prev => ({
            ...prev,
            detalles: [...prev.detalles, {
                productoId: prod.productoId,
                nombre: prod.productoNombre,
                cantidad: Number(cantidad),
                codigo: prod.productoCodigo
            }]
        }));
        setSelectedProducto('');
        setCantidad(1);
    };

    const handleSend = async () => {
        if (!transferData.almacenOrigenId || !transferData.almacenDestinoId) return alertError('Seleccione almacenes');
        if (transferData.detalles.length === 0) return alertError('Añada al menos un ítem');
        if (transferData.almacenOrigenId === transferData.almacenDestinoId) return alertError('Origen y destino deben ser diferentes');

        setLoading(true);
        try {
            await invService.enviarTransferencia({
                almacenOrigenId: parseInt(transferData.almacenOrigenId),
                almacenDestinoId: parseInt(transferData.almacenDestinoId),
                idUsuarioEnvia: user.idUsuario,
                notas: transferData.notas,
                detalles: transferData.detalles.map(d => ({ productoId: d.productoId, cantidad: d.cantidad }))
            });
            alertSuccess('Solicitud enviada correctamente');
            setShowCreateModal(false);
            fetchTransferencias();
        } catch (err: any) {
            alertError('Error al enviar', err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    // Detail State
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [details, setDetails] = useState<any[]>([]);
    const [selectedTransfer, setSelectedTransfer] = useState<any>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const handleViewDetails = async (row: any) => {
        setSelectedTransfer(row);
        setDetails([]);
        setShowDetailModal(true);
        setLoadingDetails(true);
        try {
            const res = await invService.getTransferenciaDetalles(row.idTransferencia);
            setDetails(res.data.data || res.data || []);
        } catch (e) {
            console.error(e);
            setDetails([]);
        } finally {
            setLoadingDetails(false);
        }
    };

    const columns = [
        {
            key: 'idTransferencia',
            label: 'ID',
            render: (val: any, row: any) => (
                <b
                    style={{ cursor: 'pointer', color: 'var(--accent)', textDecoration: 'underline' }}
                    onClick={() => handleViewDetails(row)}
                >
                    TR-{val}
                </b>
            )
        },
        { key: 'almacenOrigenNombre', label: 'Origen' },
        { key: 'almacenDestinoNombre', label: 'Destino' },
        { key: 'usuarioEnviaNombre', label: 'Solicitante' },
        {
            key: 'fechaEnvio',
            label: 'Fecha',
            render: (val: string) => new Date(val).toLocaleString()
        },
        {
            key: 'estado',
            label: 'Estado',
            render: (val: string) => (
                <span className={`badge ${val === 'COMPLETADO' ? 'badge-success' : 'badge-warning'}`}>
                    {val === 'COMPLETADO' ? 'COMPLETADO' : 'EN PROCESO'}
                </span>
            )
        },
        {
            key: 'acciones',
            label: 'Detalles',
            render: (_: any, row: any) => (
                <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 8px' }} onClick={() => handleViewDetails(row)}>Ver Ítems</button>
            )
        }
    ];

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <DataTable
                title={isTecnico ? "Mis Pedidos de Material" : "Historial de Traslados"}
                description={isTecnico ? "Solicitudes y recepciones automáticas." : "Registro de movimientos directos entre bodegas."}
                columns={columns}
                data={transferencias}
                loading={loadingList}
                allowExport={true}
                actions={
                    <button className="btn-primary" onClick={handleOpenCreate}>
                        {isTecnico ? '📦 Solicitar Material' : '🚚 Registrar Traslado'}
                    </button>
                }
            />

            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title={isTecnico ? "Nueva Solicitud a Bodega Central" : "Registro de Traslado Directo"}
                width="700px"
                footer={<>
                    <button className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                    <button className="btn-primary" onClick={handleSend} disabled={loading}>{loading ? 'Procesando...' : 'Confirmar Traslado'}</button>
                </>}
            >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
                    <div>
                        <label className="form-label">ALMACÉN ORIGEN</label>
                        <select
                            className="form-input"
                            value={transferData.almacenOrigenId}
                            disabled={isTecnico}
                            onChange={e => {
                                setTransferData({ ...transferData, almacenOrigenId: e.target.value, detalles: [] });
                                fetchStockOrigen(e.target.value);
                            }}
                        >
                            <option value="">-- Seleccionar --</option>
                            {almacenes.map(a => <option key={a.idAlmacen} value={a.idAlmacen}>{a.nombre}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="form-label">ALMACÉN DESTINO</label>
                        <select
                            className="form-input"
                            value={transferData.almacenDestinoId}
                            disabled={isTecnico}
                            onChange={e => setTransferData({ ...transferData, almacenDestinoId: e.target.value })}
                        >
                            <option value="">-- Seleccionar --</option>
                            {almacenes.map(a => <option key={a.idAlmacen} value={a.idAlmacen}>{a.nombre}</option>)}
                        </select>
                    </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '15px' }}>Buscar Material en Origen</h4>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <select className="form-input" style={{ flex: 3 }} value={selectedProducto} onChange={e => setSelectedProducto(e.target.value)}>
                            <option value="">-- Buscar Producto --</option>
                            {availableStock.map(p => <option key={p.productoId} value={p.productoId}>{p.productoNombre} ({p.cantidad} disp.)</option>)}
                        </select>
                        <input type="number" className="form-input" style={{ flex: 1 }} placeholder="Cant." min="1" value={cantidad} onChange={e => setCantidad(Number(e.target.value))} />
                        <button className="btn-secondary" onClick={addItem}>Añadir</button>
                    </div>
                </div>

                <table style={{ width: '100%', marginBottom: '20px' }}>
                    <thead style={{ fontSize: '0.75rem', color: '#888' }}>
                        <tr style={{ textAlign: 'left' }}>
                            <th style={{ padding: '10px' }}>Producto</th>
                            <th style={{ padding: '10px', textAlign: 'right' }}>Cantidad</th>
                            <th style={{ padding: '10px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {transferData.detalles.length === 0 ? (
                            <tr><td colSpan={3} style={{ textAlign: 'center', padding: '20px', color: '#666' }}>Sin ítems agregados</td></tr>
                        ) : (
                            transferData.detalles.map((d, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #222' }}>
                                    <td style={{ padding: '10px' }}>{d.nombre}</td>
                                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700 }}>{d.cantidad}</td>
                                    <td style={{ padding: '10px', textAlign: 'right' }}>
                                        <button style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer' }} onClick={() => setTransferData({ ...transferData, detalles: transferData.detalles.filter((_, idx) => idx !== i) })}>✕</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                <textarea className="form-input" value={transferData.notas} onChange={e => setTransferData({ ...transferData, notas: e.target.value })} placeholder="Notas del traslado..." style={{ minHeight: '80px' }} />
            </Modal>

            <Modal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                title={`Detalle de Transferencia TR-${selectedTransfer?.idTransferencia || ''}`}
            >
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '0.9rem', color: '#aaa' }}>
                        <div>Origen: <b style={{ color: 'white' }}>{selectedTransfer?.almacenOrigenNombre}</b></div>
                        <div>Destino: <b style={{ color: 'white' }}>{selectedTransfer?.almacenDestinoNombre}</b></div>
                    </div>

                    {loadingDetails ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>Cargando detalles...</div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #444', textAlign: 'left' }}>
                                    <th style={{ padding: '8px' }}>Código</th>
                                    <th style={{ padding: '8px' }}>Producto</th>
                                    <th style={{ padding: '8px', textAlign: 'right' }}>Cantidad</th>
                                </tr>
                            </thead>
                            <tbody>
                                {details.length === 0 ? (
                                    <tr><td colSpan={3} style={{ textAlign: 'center', padding: '20px', color: '#666' }}>No hay detalles disponibles</td></tr>
                                ) : (
                                    details.map((d: any, i: number) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #333' }}>
                                            <td style={{ padding: '8px', fontSize: '0.85rem', color: '#888' }}>{d.productoCodigo}</td>
                                            <td style={{ padding: '8px' }}>{d.productoNombre}</td>
                                            <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{d.cantidad}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}

                    <div style={{ marginTop: '20px', fontSize: '0.85rem', color: '#666' }}>
                        <p>Notas: {selectedTransfer?.notas || 'Sin notas.'}</p>
                    </div>
                    <div style={{ marginTop: '20px', textAlign: 'right' }}>
                        <button className="btn-secondary" onClick={() => setShowDetailModal(false)}>Cerrar</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
