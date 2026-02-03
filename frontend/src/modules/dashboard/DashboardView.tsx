import { useState, useEffect } from 'react';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import {
    TrendingUp, TrendingDown, AlertTriangle, Package,
    DollarSign, ClipboardList
} from 'lucide-react';
import { invService, opeService } from '../../services/api.service';

const Card = ({ children, className = '' }: any) => (
    <div className={`card ${className}`} style={{
        background: '#1e293b',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    }}>
        {children}
    </div>
);

const StatBox = ({ title, value, subtext, icon: Icon, trend, color, onClick }: any) => (
    <Card
        className={onClick ? 'clickable-card' : ''}
        style={{ cursor: onClick ? 'pointer' : 'default', transition: 'transform 0.2s' }}
        onClick={onClick}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
            <div style={{
                padding: '12px',
                borderRadius: '12px',
                background: `rgba(${color}, 0.1)`,
                color: `rgb(${color})`
            }}>
                <Icon size={24} strokeWidth={2.5} />
            </div>
            {trend && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: trend > 0 ? '#10b981' : '#f43f5e',
                    background: trend > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                    padding: '4px 8px',
                    borderRadius: '20px'
                }}>
                    {trend > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {Math.abs(trend)}%
                </div>
            )}
        </div>
        <div style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600, marginBottom: '5px' }}>{title}</div>
        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-1px' }}>{value}</div>
        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '5px' }}>{subtext}</div>
    </Card>
);

export const DashboardView = ({ user, onNavigate }: { user: any, onNavigate: (view: string) => void }) => {
    const [metrics, setMetrics] = useState<any>(null);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [otStats, setOtStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Mock Data for Charts (Simulating historical data if not available)
    const inventoryTrend = [
        { name: 'Ene', valor: 42000 },
        { name: 'Feb', valor: 43500 },
        { name: 'Mar', valor: 41000 },
        { name: 'Abr', valor: 45200 },
        { name: 'May', valor: 44800 },
        { name: 'Jun', valor: 46500 },
    ];

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Parallel fetching of dashboard data
                const [metricsRes, activityRes, otRes] = await Promise.all([
                    (invService as any).getDashboardMetrics().catch(() => ({ data: {} })),
                    invService.getTransferencias().catch(() => ({ data: [] })),
                    opeService.listarOTs().catch(() => ({ data: [] }))
                ]);

                setMetrics(metricsRes.data.data || metricsRes.data || {});

                // Process Recent Activity (Transfers)
                const activities = (activityRes.data.data || activityRes.data || [])
                    .slice(0, 5) // Last 5
                    .map((item: any) => ({
                        id: item.idTransferencia,
                        ref: `#TRF-${item.idTransferencia}`,
                        type: 'Transferencia',
                        detail: `De ${item.origenNombre} a ${item.destinoNombre}`,
                        user: item.usuarioNombre || 'Sistema',
                        time: new Date(item.fechaCreation),
                        status: item.estado
                    }));
                setRecentActivity(activities);

                // Process OT Stats
                const ots = otRes.data.data || otRes.data || [];
                const statusCounts = ots.reduce((acc: any, curr: any) => {
                    const status = curr.estado || 'Pendiente';
                    acc[status] = (acc[status] || 0) + 1;
                    return acc;
                }, {});

                const chartData = Object.keys(statusCounts).map(key => ({
                    name: key,
                    value: statusCounts[key]
                }));

                // Fallback if no OTs
                setOtStats(chartData.length > 0 ? chartData : [
                    { name: 'Sin Datos', value: 1 }
                ]);

            } catch (err) {
                console.error('Error fetching dashboard data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const COLORS = ['#94a3b8', '#3b82f6', '#10b981', '#ef4444', '#f59e0b'];

    if (loading) return (
        <div style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            flexDirection: 'column',
            gap: '15px'
        }}>
            <div className="spinner"></div>
            Cargando inteligencia de negocios...
        </div>
    );

    return (
        <div style={{ animation: 'fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            {/* Header Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '20px', marginBottom: '30px', alignItems: 'end' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>Resumen Operativo</h1>
                    <p style={{ color: '#94a3b8', margin: '5px 0 0' }}>Bienvenido, {user.nombre}</p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-secondary" onClick={() => onNavigate('operaciones')} style={{ height: '42px' }}>
                        <ClipboardList size={20} style={{ marginRight: '8px' }} />
                        Crear OT
                    </button>
                    <button className="btn-primary" onClick={() => onNavigate('activos')} style={{ height: '42px', background: '#ef4444' }}>
                        <Package size={20} style={{ marginRight: '8px' }} />
                        Buscar Serial
                    </button>
                </div>
            </div>

            {/* KPI Grid - Enterprise Style */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '20px',
                marginBottom: '30px'
            }}>
                <StatBox
                    title="Valor Inventario"
                    value={`$${((metrics?.valorInventario || 0) / 1000).toFixed(1)}k`}
                    subtext="Capital Actual"
                    icon={DollarSign}
                    color="16, 185, 129"
                    onClick={() => onNavigate('inventario')}
                />
                <StatBox
                    title="OTs Pendientes"
                    value={otStats.find(s => s.name === 'Pendiente' || s.name === 'ABIERTA')?.value || 0}
                    subtext="Atención Requerida"
                    icon={ClipboardList}
                    color="59, 130, 246"
                    onClick={() => onNavigate('operaciones')}
                />
                <StatBox
                    title="Transferencias"
                    value={recentActivity.filter(a => a.status === 'PENDIENTE').length}
                    subtext="Por confirmar"
                    icon={TrendingUp}
                    color="245, 158, 11"
                    onClick={() => onNavigate('transferencias')}
                />
                <StatBox
                    title="Alertas Stock"
                    value={metrics?.alertasStock || 0}
                    subtext="Bajo Mínimo"
                    icon={AlertTriangle}
                    color="239, 68, 68"
                    onClick={() => onNavigate('inventario')}
                />
            </div>

            {/* Charts Section */}
            <div className="dashboard-charts-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
                gap: '20px',
                marginBottom: '30px'
            }}>
                <Card>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Evolución Financiera</h3>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Proyección Estimada</div>
                    </div>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <AreaChart data={inventoryTrend}>
                                <defs>
                                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
                                <Tooltip
                                    contentStyle={{ background: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                                    itemStyle={{ color: '#60a5fa' }}
                                />
                                <Area type="monotone" dataKey="valor" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>Estado de Órdenes (OT)</h3>
                    <div style={{ height: '200px', marginBottom: '20px' }}>
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <PieChart>
                                <Pie
                                    data={otStats}
                                    innerRadius={55}
                                    outerRadius={75}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {otStats.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ background: '#1e293b', borderColor: '#334155', borderRadius: '8px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        {otStats.map((item, index) => (
                            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#cbd5e1', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[index % COLORS.length] }}></div>
                                    {item.name}
                                </div>
                                <span style={{ fontWeight: 700 }}>{item.value}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Recent Activity Table */}
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Actividad Reciente (Transferencias)</h3>
                    <button
                        className="btn-secondary"
                        style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                        onClick={() => onNavigate('transferencias')}
                    >
                        Ver historial completo
                    </button>
                </div>
                <div style={{ overflowX: 'auto', margin: '0 -24px' }}>
                    <table style={{ width: '100%', minWidth: '800px', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ color: '#94a3b8', borderBottom: '1px solid #334155', textAlign: 'left' }}>
                                <th style={{ padding: '15px 24px', fontWeight: 600 }}>REFERENCIA</th>
                                <th style={{ padding: '15px 10px', fontWeight: 600 }}>TIPO</th>
                                <th style={{ padding: '15px 10px', fontWeight: 600 }}>DETALLE</th>
                                <th style={{ padding: '15px 10px', fontWeight: 600 }}>USUARIO</th>
                                <th style={{ padding: '15px 10px', fontWeight: 600 }}>HORA</th>
                                <th style={{ padding: '15px 24px', fontWeight: 600, textAlign: 'right' }}>ESTADO</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentActivity.length > 0 ? (
                                recentActivity.map((item, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <td style={{ padding: '15px 24px', fontFamily: 'monospace', color: '#60a5fa', fontWeight: 700 }}>{item.ref}</td>
                                        <td style={{ padding: '15px 10px' }}>{item.type}</td>
                                        <td style={{ padding: '15px 10px', color: '#cbd5e1' }}>{item.detail}</td>
                                        <td style={{ padding: '15px 10px' }}>{item.user}</td>
                                        <td style={{ padding: '15px 10px', color: '#94a3b8' }}>
                                            {item.time.toLocaleDateString()} {item.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td style={{ padding: '15px 24px', textAlign: 'right' }}>
                                            <span className={`badge ${item.status === 'COMPLETADO' || item.status === 'APROBADO' ? 'badge-success' :
                                                item.status === 'PENDIENTE' ? 'badge-warning' : 'badge-danger'
                                                }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                                        No hay actividad reciente registrada
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};
