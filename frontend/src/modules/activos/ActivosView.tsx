import { useState } from 'react';
import { activosService, invService } from '../../services/api.service';
import { Search, MapPin, User, Calendar, Box, History, Smartphone, AlertTriangle } from 'lucide-react';
import { SidePanel } from '../../components/SidePanel';
import { KardexTimeline } from '../inventario/components/KardexTimeline';

export const ActivosView = () => {
    const [busqueda, setBusqueda] = useState('');
    const [activo, setActivo] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // History SidePanel State
    const [showHistory, setShowHistory] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [historyData, setHistoryData] = useState<any[]>([]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!busqueda) return;

        setLoading(true);
        setError('');
        setActivo(null);
        setShowHistory(false);

        try {
            const res = await activosService.buscarActivo(busqueda);
            if (res.data) {
                setActivo(res.data);
            } else {
                setError('No se encontró ningún activo con ese número de serie.');
            }
        } catch (err) {
            console.error(err);
            setError('Error al buscar el activo. Intente nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleViewHistory = async () => {
        if (!activo) return;
        setShowHistory(true);
        setLoadingHistory(true);
        try {
            // Fetch history for the PRODUCT related to this asset
            // Ideally this would be filtered by serial if the backend supported it, 
            // but for now we show the product's timeline.
            const res = await invService.getHistoriaProducto(activo.idProducto);
            setHistoryData(res.data.data || res.data || []);
        } catch (err) {
            console.error("Error fetching history", err);
        } finally {
            setLoadingHistory(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 10px 0', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Rastreador de Activos
                </h1>
                <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Localiza equipos, herramientas y materiales por número de serie.</p>
            </div>

            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '40px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)', borderRadius: '16px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <input
                        className="form-input"
                        placeholder="Ej: SN-2024-001..."
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        style={{ paddingLeft: '50px', fontSize: '1.2rem', height: '64px', borderRadius: '16px 0 0 16px', border: '1px solid #334155', background: '#1e293b' }}
                        autoFocus
                    />
                    <Search
                        size={28}
                        style={{ position: 'absolute', left: '16px', top: '18px', color: '#64748b' }}
                    />
                </div>
                <button
                    type="submit"
                    className="btn-primary"
                    style={{ padding: '0 40px', fontSize: '1.1rem', borderRadius: '0 16px 16px 0', fontWeight: 700, letterSpacing: '0.5px' }}
                    disabled={loading}
                >
                    {loading ? 'Rastreando...' : 'BUSCAR'}
                </button>
            </form>

            {error && (
                <div style={{
                    padding: '20px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: '#f87171',
                    borderRadius: '16px',
                    textAlign: 'center',
                    fontWeight: 500,
                    animation: 'shake 0.4s cubic-bezier(.36,.07,.19,.97) both'
                }}>
                    <AlertTriangle size={24} style={{ display: 'block', margin: '0 auto 10px auto' }} />
                    {error}
                </div>
            )}

            {activo && (
                <div style={{ animation: 'slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                    <div className="card" style={{
                        padding: '0',
                        overflow: 'hidden',
                        border: '1px solid #334155',
                        background: '#0f172a'
                    }}>
                        {/* Status Strip */}
                        <div style={{
                            height: '8px',
                            background: activo.estado === 'DISPONIBLE' ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #f59e0b, #d97706)',
                            width: '100%'
                        }} />

                        <div style={{ padding: '30px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
                                <div>
                                    <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>IDENTIDAD DEL ACTIVO</div>
                                    <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: '#f8fafc', lineHeight: 1.1 }}>{activo.productoNombre}</h2>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                                        <span style={{ fontFamily: 'monospace', background: '#334155', color: '#e2e8f0', padding: '4px 10px', borderRadius: '6px', fontWeight: 600, fontSize: '1.1rem' }}>
                                            {activo.serial}
                                        </span>
                                        <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>• {activo.productoCodigo}</span>
                                    </div>
                                </div>

                                <span style={{
                                    background: activo.estado === 'DISPONIBLE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                    color: activo.estado === 'DISPONIBLE' ? '#34d399' : '#fbbf24',
                                    padding: '8px 16px',
                                    borderRadius: '12px',
                                    fontWeight: 700,
                                    fontSize: '0.9rem',
                                    border: `1px solid ${activo.estado === 'DISPONIBLE' ? '#059669' : '#d97706'}`,
                                    boxShadow: `0 0 15px ${activo.estado === 'DISPONIBLE' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
                                }}>
                                    {activo.estado}
                                </span>
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '20px',
                                background: '#1e293b',
                                padding: '20px',
                                borderRadius: '16px',
                                marginBottom: '25px'
                            }}>
                                <InfoItem icon={MapPin} label="Ubicación Actual" value={activo.ubicacionAlmacen || 'En Tránsito / Desconocida'} highlight />
                                <InfoItem icon={User} label="Responsable Custodio" value={activo.tecnicoResponsable || activo.clienteAsignado || 'Sin asignar'} />
                                <InfoItem icon={Calendar} label="Fecha de Alta" value={activo.fechaIngreso ? new Date(activo.fechaIngreso).toLocaleDateString() : 'N/A'} />
                                <InfoItem icon={Smartphone} label="Modelo" value={activo.modelo || 'Estándar'} />
                            </div>

                            <button
                                className="btn-secondary"
                                onClick={handleViewHistory}
                                style={{ width: '100%', padding: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '1rem', fontWeight: 600 }}
                            >
                                <History size={20} />
                                Ver Trazabilidad Completa
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* History Drawer */}
            <SidePanel
                isOpen={showHistory}
                onClose={() => setShowHistory(false)}
                title="Trazabilidad del Activo"
                width="600px"
            >
                <div style={{ padding: '0 5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px', background: '#1e293b', padding: '15px', borderRadius: '12px' }}>
                        <div style={{ width: '50px', height: '50px', background: '#334155', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Box size={24} color="#94a3b8" />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{activo?.productoNombre}</h3>
                            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>SN: {activo?.serial}</div>
                        </div>
                    </div>

                    {loadingHistory ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Cargando historial...</div>
                    ) : (
                        <KardexTimeline movimientos={historyData} />
                    )}
                </div>
            </SidePanel>
        </div>
    );
};

const InfoItem = ({ icon: Icon, label, value, highlight = false }: any) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <div style={{
            width: '44px', height: '44px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: highlight ? 'var(--primary)' : '#94a3b8',
            border: '1px solid rgba(255,255,255,0.05)'
        }}>
            <Icon size={22} />
        </div>
        <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
            <div style={{
                fontWeight: highlight ? 700 : 600,
                fontSize: highlight ? '1.05rem' : '0.95rem',
                color: highlight ? '#f8fafc' : '#cbd5e1'
            }}>
                {value}
            </div>
        </div>
    </div>
);
