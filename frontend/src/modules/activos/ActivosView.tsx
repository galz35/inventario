import { useState } from 'react';
import { activosService } from '../../services/api.service';
import { Search, MapPin, User, Archive, Calendar, Box } from 'lucide-react';

export const ActivosView = () => {
    const [busqueda, setBusqueda] = useState('');
    const [activo, setActivo] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!busqueda) return;

        console.log("Searching for:", busqueda);
        setLoading(true);
        setError('');
        setActivo(null);

        try {
            const res = await activosService.buscarActivo(busqueda);
            console.log("Res:", res.data);
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

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '20px', textAlign: 'center' }}>
                Rastreador de Activos
            </h1>

            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '40px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <input
                        className="form-input"
                        placeholder="Escanea o escribe el Serial (SN...)"
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        style={{ paddingLeft: '45px', fontSize: '1.2rem', height: '60px' }}
                        autoFocus
                    />
                    <Search
                        size={28}
                        style={{ position: 'absolute', left: '12px', top: '16px', color: 'var(--text-muted)' }}
                    />
                </div>
                <button
                    type="submit"
                    className="btn-primary"
                    style={{ padding: '0 30px', fontSize: '1.1rem' }}
                    disabled={loading}
                >
                    {loading ? 'Buscando...' : 'Rastrear'}
                </button>
            </form>

            {error && (
                <div style={{
                    padding: '20px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    borderRadius: '12px',
                    textAlign: 'center',
                    fontWeight: 600
                }}>
                    {error}
                </div>
            )}

            {activo && (
                <div style={{ animation: 'slideIn 0.3s ease-out' }}>
                    <div className="card" style={{
                        borderLeft: `6px solid ${activo.estado === 'DISPONIBLE' ? '#10b981' : '#f59e0b'}`,
                        padding: '30px',
                        marginBottom: '20px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
                            <div>
                                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>{activo.productoNombre}</h2>
                                <div style={{ fontFamily: 'monospace', color: 'var(--text-dim)', fontSize: '1.1rem', marginTop: '5px' }}>
                                    SN: {activo.serial}
                                </div>
                            </div>
                            <span style={{
                                background: activo.estado === 'DISPONIBLE' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                color: activo.estado === 'DISPONIBLE' ? '#10b981' : '#f59e0b',
                                padding: '8px 16px',
                                borderRadius: '20px',
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                border: '1px solid currentColor'
                            }}>
                                {activo.estado}
                            </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                            <InfoItem icon={MapPin} label="Ubicación Actual" value={activo.ubicacionAlmacen || 'No definida'} highlight />
                            <InfoItem icon={User} label="Responsable" value={activo.tecnicoResponsable || activo.clienteAsignado || 'Sin asignar'} />
                            <InfoItem icon={Box} label="Código Producto" value={activo.productoCodigo} />
                            <InfoItem icon={Calendar} label="Fecha Ingreso" value={activo.fechaIngreso ? new Date(activo.fechaIngreso).toLocaleDateString() : '-'} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const InfoItem = ({ icon: Icon, label, value, highlight = false }: any) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
            width: '40px', height: '40px',
            borderRadius: '10px',
            background: 'var(--bg-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-dim)'
        }}>
            <Icon size={20} />
        </div>
        <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{label}</div>
            <div style={{
                fontWeight: highlight ? 800 : 600,
                fontSize: highlight ? '1.1rem' : '1rem',
                color: highlight ? 'var(--primary)' : 'var(--text-primary)'
            }}>
                {value}
            </div>
        </div>
    </div>
);
