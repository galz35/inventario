import React, { useState, useEffect } from 'react';
import { invService } from '../../services/api.service';
import { DataTable } from '../../components/DataTable';
import { ArrowLeft, Box, FileText } from 'lucide-react';
import { alertError } from '../../services/alert.service';

interface VendorProfileProps {
    providerId: number;
    providerName: string;
    onBack: () => void;
}

export const VendorProfileView: React.FC<VendorProfileProps> = ({ providerId, providerName, onBack }) => {
    const [data, setData] = useState<{ stock: any[], historial: any[] } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [providerId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await invService.getProveedorResumen(providerId);
            const result = res.data.data || res.data;
            if (result) {
                setData(result);
            } else {
                throw new Error('Datos vacíos');
            }
        } catch (e) {
            console.error(e);
            alertError('Error', 'No se pudieron cargar los datos del proveedor.');
            setData({ stock: [], historial: [] });
        } finally {
            setLoading(false);
        }
    };

    if (loading && !data) return <div className="p-4">Cargando perfil de proveedor...</div>;

    return (
        <div className="animate-fade">
            <button
                onClick={onBack}
                className="btn-secondary"
                style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
                <ArrowLeft size={16} /> Volver a Lista
            </button>

            <div className="card" style={{ padding: '30px', marginBottom: '30px', borderLeft: '5px solid var(--primary)' }}>
                <h1 style={{ margin: 0, fontSize: '2rem' }}>{providerName}</h1>
                <p style={{ color: '#888', marginTop: '5px' }}>Perfil de Proveedor de Consignación</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.9rem', color: '#aaa' }}>Total Items en Stock</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{data?.stock?.length || 0}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.9rem', color: '#aaa' }}>Liquidaciones Históricas</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{data?.historial?.length || 0}</div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="card" style={{ padding: '20px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Box /> Stock Actual (Propiedad Proveedor)</h3>
                    <DataTable
                        data={data?.stock || []}
                        columns={[
                            { key: 'producto', label: 'Producto', render: (v: any, r: any) => <div><b>{v}</b><br /><small>{r.codigo}</small></div> },
                            { key: 'almacen', label: 'Ubicación' },
                            { key: 'cantidad', label: 'Cant.', render: (v: any, r: any) => <b>{v} {r.unidad}</b> }
                        ]}
                        title=""
                    />
                </div>

                <div className="card" style={{ padding: '20px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><FileText /> Historial de Cortes</h3>
                    <DataTable
                        data={data?.historial || []}
                        columns={[
                            { key: 'idLiquidacion', label: 'Ref', render: (v: any) => <small>LIQ-{v}</small> },
                            { key: 'fechaCorte', label: 'Fecha', render: (v: string) => new Date(v).toLocaleDateString() },
                            { key: 'totalPagar', label: 'Monto', render: (v: number) => <span className="text-success">${Number(v).toFixed(2)}</span> },
                            { key: 'estado', label: 'Estado', render: (v: string) => <span className={`badge ${v === 'PROCESADO' ? 'badge-success' : 'badge-warning'}`}>{v}</span> }
                        ]}
                        title=""
                    />
                </div>
            </div>
        </div>
    );
};
