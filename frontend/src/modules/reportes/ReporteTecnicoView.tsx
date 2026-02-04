import { useState, useEffect } from 'react';
import { invService } from '../../services/api.service';
import { DataTable } from '../../components/DataTable';
import { Calendar, FileText, Search } from 'lucide-react';
import { alertError } from '../../services/alert.service';

export const ReporteTecnicoView = () => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadReport();
    }, []); // Load once on mount, then user clicks search

    const loadReport = async () => {
        setLoading(true);
        try {
            const res = await invService.getTecnicoConsumoDiario(date);
            setData(res.data.data || res.data || []);
        } catch (e) {
            console.error(e);
            alertError('Error al cargar reporte');
        } finally {
            setLoading(false);
        }
    };

    // Calculate totals
    const totalItems = data.length;
    // Normalize consigned check
    const consignedItems = data.filter((d: any) => d.proveedorConsignado || d.esConsignacion).length;

    return (
        <div className="animate-fade" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                    <FileText /> Reporte de Consumo Técnico (Detalle Diario)
                </h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <div className="input-group" style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', padding: '5px 10px', borderRadius: '8px', gap: '10px' }}>
                        <Calendar size={16} />
                        <input
                            type="date"
                            className="form-input"
                            style={{ border: 'none', background: 'transparent', color: '#fff' }}
                            value={date}
                            onChange={e => setDate(e.target.value)}
                        />
                        <button className="btn-primary" onClick={loadReport} disabled={loading} style={{ padding: '6px 12px', fontSize: '0.8rem', height: '30px' }}>
                            <Search size={14} style={{ marginRight: '5px' }} /> Consultar
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.9rem', color: '#888' }}>Total Movimientos</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{totalItems}</div>
                </div>
                <div className="card" style={{ padding: '20px', textAlign: 'center', borderBottom: '4px solid #fbbf24' }}>
                    <div style={{ fontSize: '0.9rem', color: '#888' }}>Items Consignados Usados</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fbbf24' }}>{consignedItems}</div>
                </div>
            </div>

            <DataTable
                data={data}
                loading={loading}
                title={`Desglose del día ${new Date(date).toLocaleDateString()}`}
                columns={[
                    { key: 'tecnicoNombre', label: 'Técnico' },
                    { key: 'proyectoNombre', label: 'Proyecto', render: (v: any) => <span style={{ fontWeight: 600 }}>{v || '-'}</span> },
                    { key: 'otCodigo', label: 'OT Ref.', render: (v: any) => <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>OT-{v}</span> },
                    { key: 'productoNombre', label: 'Material', render: (v: any, r: any) => <div>{v}<br /><small style={{ color: '#666' }}>{r.productoCodigo}</small></div> },
                    { key: 'cantidad', label: 'Cant.', render: (v: any) => <b>{v}</b> },
                    { key: 'fechaCierre', label: 'Hora', render: (v: string) => v ? new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-' }
                ]}
            />
        </div>
    );
};
