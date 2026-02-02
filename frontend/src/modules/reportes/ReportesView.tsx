import { useState, useEffect } from 'react';
import { invService } from '../../services/api.service';
import { DataTable } from '../../components/DataTable';
import { ReporteTecnicoView } from './ReporteTecnicoView';

export const ReportesView = () => {
    const [slaData, setSlaData] = useState([]);
    const [consumoData, setConsumoData] = useState([]);
    const [activeTab, setActiveTab] = useState('sla'); // sla | consumo
    const [loading, setLoading] = useState(true);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await invService.getReporteSLA();
            setSlaData(res.data.data || res.data || []);

            const resConsumo = await invService.getReporteConsumoProyecto();
            setConsumoData(resConsumo.data.data || resConsumo.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const slaColumns = [
        { key: 'idOT', label: 'OT #', render: (val: any) => <b>#{val}</b> },
        { key: 'tecnico', label: 'Técnico' },
        { key: 'tipoOT', label: 'Tipo' },
        { key: 'fechaCierre', label: 'Fecha Cierre' },
        { key: 'horasTranscurridas', label: 'Tiempo (h)', render: (val: any) => `${val}h` },
        { key: 'slaMeta', label: 'Meta (h)', render: (val: any) => `${val}h` },
        {
            key: 'estadoSLA',
            label: 'Estado',
            render: (val: string) => (
                <span className={`badge ${val === 'DENTRO' ? 'badge-success' : 'badge-danger'}`}>
                    {val}
                </span>
            )
        }
    ];

    const consumoColumns = [
        { key: 'Proyecto', label: 'Proyecto', render: (val: any) => <b>{val}</b> },
        { key: 'Tarea', label: 'Tarea WBS', render: (val: any) => val || 'General' },
        { key: 'productoNombre', label: 'Material' },
        { key: 'TotalConsumido', label: 'Cant.', render: (val: any) => <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{val}</span> },
        { key: 'unidad', label: 'Unidad' }
    ];

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <header style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 900 }}>Inteligencia de Negocio</h1>
                <p>Análisis de cumplimiento de SLA y eficiencia técnica.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                <ReportCard title="SLA Global" value="94.2%" color="var(--secondary)" subtitle="Meta: 95%" />
                <ReportCard title="Tiempo Promedio de Cierre" value="4.2 Hrs" color="var(--accent)" subtitle="Meta: < 5h" />
                <ReportCard title="OTs Fuera de Tiempo" value="12" color="var(--primary)" subtitle="Requieren Auditoría" />
            </div>

            <div className="card" style={{ padding: '0' }}>
                <div style={{ display: 'flex', gap: '20px', padding: '20px', borderBottom: '1px solid var(--border)' }}>
                    <h3
                        onClick={() => setActiveTab('sla')}
                        style={{ margin: 0, cursor: 'pointer', color: activeTab === 'sla' ? 'var(--primary)' : '#666', borderBottom: activeTab === 'sla' ? '2px solid var(--primary)' : 'none', paddingBottom: '5px' }}
                    >Cumplimiento SLA</h3>
                    <h3
                        onClick={() => setActiveTab('consumo')}
                        style={{ margin: 0, cursor: 'pointer', color: activeTab === 'consumo' ? 'var(--primary)' : '#666', borderBottom: activeTab === 'consumo' ? '2px solid var(--primary)' : 'none', paddingBottom: '5px' }}
                    >Consumo de Materiales</h3>
                    <h3
                        onClick={() => setActiveTab('tecnico')}
                        style={{ margin: 0, cursor: 'pointer', color: activeTab === 'tecnico' ? 'var(--primary)' : '#666', borderBottom: activeTab === 'tecnico' ? '2px solid var(--primary)' : 'none', paddingBottom: '5px' }}
                    >Consumo Técnico Diario</h3>
                </div>

                {activeTab === 'tecnico' ? (
                    <ReporteTecnicoView />
                ) : (
                    <DataTable
                        columns={activeTab === 'sla' ? slaColumns : consumoColumns}
                        data={activeTab === 'sla' ? slaData : consumoData}
                        loading={loading}
                        title={activeTab === 'sla' ? "Historial de cumplimiento de tiempos" : "Detalle de materiales consumidos por proyecto"}
                        allowExport={true}
                    />
                )}
            </div>
        </div>
    );
};

const ReportCard = ({ title, value, color, subtitle }: any) => (
    <div className="card" style={{ borderLeft: `5px solid ${color}` }}>
        <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '10px', fontWeight: 700 }}>{title}</div>
        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: color }}>{value}</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{subtitle}</div>
    </div>
);
