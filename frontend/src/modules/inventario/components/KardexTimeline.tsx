import { Truck, ArrowRight, CheckCircle, AlertTriangle, Box, FileText } from 'lucide-react';

export const KardexTimeline = ({ movimientos }: { movimientos: any[] }) => {

    if (!movimientos || movimientos.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                <Box size={48} style={{ marginBottom: '10px', opacity: 0.5 }} />
                <div>No hay movimientos registrados para este periodo.</div>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px 0', position: 'relative' }}>
            <div style={{
                position: 'absolute',
                left: '24px',
                top: '20px',
                bottom: '20px',
                width: '2px',
                background: 'rgba(255,255,255,0.1)'
            }} />

            {movimientos.map((mov, idx) => (
                <div key={idx} style={{
                    display: 'flex',
                    gap: '20px',
                    marginBottom: '25px',
                    position: 'relative',
                    animation: `slideIn 0.3s ease-out ${idx * 0.05}s both`
                }}>
                    {/* Icon Bubble */}
                    <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '25px',
                        background: getIconColor(mov.tipoMovimiento),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2,
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
                        border: '4px solid #0f172a'
                    }}>
                        {getIcon(mov.tipoMovimiento)}
                    </div>

                    {/* Content Card */}
                    <div style={{
                        flex: 1,
                        background: '#1e293b',
                        padding: '15px',
                        borderRadius: '12px',
                        borderLeft: `4px solid ${getIconColor(mov.tipoMovimiento)}`
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.95rem' }}>
                                {formatTipo(mov.tipoMovimiento)}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                {new Date(mov.fechaMovimiento).toLocaleString()}
                            </span>
                        </div>

                        <div style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '10px' }}>
                            {mov.tipoMovimiento.includes('TRANSFERENCIA') && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>{mov.origen || 'Origen'}</span>
                                    <ArrowRight size={14} />
                                    <span>{mov.destino || 'Destino'}</span>
                                </div>
                            )}
                            {mov.tipoMovimiento.includes('CONSUMO') && (
                                <div>Usado en: <b>{mov.referenciaTexto || 'OT Sin Referencia'}</b></div>
                            )}
                            {mov.tipoMovimiento.includes('ENTRADA') && (
                                <div>Fuente: <b>{mov.origen || 'Proveedor/Compra'}</b></div>
                            )}
                        </div>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderTop: '1px solid rgba(255,255,255,0.05)',
                            paddingTop: '10px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#64748b' }}>
                                <UserIcon size={14} />
                                {mov.usuario || 'Sistema'}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{
                                    fontSize: '1.2rem',
                                    fontWeight: 800,
                                    color: mov.cantidad > 0 ? '#10b981' : '#f43f5e'
                                }}>
                                    {mov.cantidad > 0 ? '+' : ''}{mov.cantidad}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                    Saldo: {mov.saldo}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// Helpers
const getIconColor = (tipo: string) => {
    if (tipo.includes('ENTRADA')) return '#10b981';
    if (tipo.includes('SALIDA') || tipo.includes('CONSUMO')) return '#f43f5e';
    if (tipo.includes('TRANSFERENCIA')) return '#3b82f6';
    if (tipo.includes('AJUSTE')) return '#f59e0b';
    return '#64748b';
};

const getIcon = (tipo: string) => {
    if (tipo.includes('ENTRADA')) return <CheckCircle size={24} color="#fff" />;
    if (tipo.includes('CONSUMO')) return <Box size={24} color="#fff" />;
    if (tipo.includes('TRANSFERENCIA')) return <Truck size={24} color="#fff" />;
    if (tipo.includes('AJUSTE')) return <AlertTriangle size={24} color="#fff" />;
    return <FileText size={24} color="#fff" />;
};

const UserIcon = ({ size }: any) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);

const formatTipo = (t: string) => {
    return t.replace(/_/g, ' ');
};
