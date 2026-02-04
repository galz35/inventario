import { useState, useEffect } from 'react';
import { invService } from '../../services/api.service';
import { DataTable } from '../../components/DataTable';
import { alertSuccess, alertError } from '../../services/alert.service';
import { Calendar, TrendingUp } from 'lucide-react';

export const CierreMesView = () => {
    const [cierres, setCierres] = useState<any[]>([]); // Typed as any[] to avoid 'never' error
    const [loading, setLoading] = useState(false);
    const [currentStock, setCurrentStock] = useState<any[]>([]);
    const [loadingStock, setLoadingStock] = useState(false);

    // Initial Load
    useEffect(() => {
        fetchCierres();
    }, []);

    const fetchCierres = async () => {
        setLoading(true);
        try {
            const res = await invService.getCierresMensuales();
            const data = res.data.data || res.data || [];
            setCierres(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchPreview = async () => {
        setLoadingStock(true);
        try {
            // Assuming getStock can serve as a preview of current inventory state
            const res = await invService.getStock({});
            setCurrentStock(res.data.data || res.data || []);
        } catch (e) {
            console.error(e);
            alertError('Error', 'No se pudo cargar la vista previa del inventario.');
        } finally {
            setLoadingStock(false);
        }
    };

    const handleGenerarCierre = async () => {
        const user = JSON.parse(localStorage.getItem('inv_user') || '{}');
        if (!user.idUsuario) {
            alertError('Error', 'Sesión de usuario no válida.');
            return;
        }

        setLoadingStock(true);
        try {
            await invService.generarCierreMensual({
                mes: `Cierre ${new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' })}`,
                idUsuario: user.idUsuario
            });

            alertSuccess(
                'Cierre Mensual Generado Correctamente',
                'El estado del inventario ha sido congelado y guardado en el histórico.'
            );
            fetchCierres();
            setCurrentStock([]);
        } catch (e) {
            alertError('Error generando cierre');
        } finally {
            setLoadingStock(false);
        }
    };

    const columns = [
        { key: 'fecha', label: 'Fecha Corte', render: (val: string) => new Date(val).toLocaleDateString() },
        { key: 'mes', label: 'Periodo' },
        { key: 'totalItems', label: 'Total Items' },
        { key: 'valorTotal', label: 'Valorización ($)', render: (val: number) => `$${Number(val).toLocaleString()}` },
        { key: 'estado', label: 'Estado', render: (val: string) => <span className="badge badge-success">{val}</span> }
    ];

    const currentMonthName = new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' });

    return (
        <div style={{ animation: 'fadeIn 0.3s' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>Cierre Mensual de Inventario</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
                Genera la "foto" fiscal del inventario al final de mes para entregar a contabilidad.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>

                {/* Action Card */}
                <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                        <Calendar size={32} color="var(--primary)" />
                        <div>
                            <h3 style={{ margin: 0, textTransform: 'capitalize' }}>Cierre de {currentMonthName}</h3>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Periodo Actual</div>
                        </div>
                    </div>
                    <p style={{ fontSize: '0.9rem', marginBottom: '20px' }}>
                        Este proceso capturará el stock actual, sus costos y generará el reporte oficial de valorización.
                    </p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn-secondary" style={{ flex: 1 }} onClick={fetchPreview} disabled={loadingStock}>
                            Ver Vista Previa
                        </button>
                        <button className="btn-primary" style={{ flex: 1 }} onClick={handleGenerarCierre} disabled={loadingStock}>
                            {loadingStock ? 'Procesando...' : '📸 Generar Corte'}
                        </button>
                    </div>
                </div>

                {/* Info Card */}
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                        <TrendingUp size={32} color="#10b981" />
                        <div>
                            <h3 style={{ margin: 0 }}>Estado del Inventario</h3>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Tiempo Real</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem' }}>
                        <span>Movimientos del Mes:</span>
                        <b>--</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem' }}>
                        <span>Pendientes de Ajuste:</span>
                        <b style={{ color: '#f59e0b' }}>--</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                        <span>Ultima Conciliación:</span>
                        <b>{cierres.length > 0 ? new Date(cierres[0].fecha).toLocaleDateString() : 'Nunca'}</b>
                    </div>
                </div>
            </div>

            {/* Preview Table */}
            {currentStock.length > 0 && (
                <div style={{ marginBottom: '40px', animation: 'slideIn 0.3s' }}>
                    <DataTable
                        title="📸 Vista Previa del Corte"
                        description="Estos son los saldos que se congelarán (Muestra de los primeros 50 items)."
                        data={currentStock.slice(0, 50)}
                        columns={[
                            { key: 'productoCodigo', label: 'Código' },
                            { key: 'productoNombre', label: 'Producto' },
                            { key: 'stockActual', label: 'Cantidad' },
                            { key: 'costoPromedio', label: 'Costo Unit ($)', render: (v: number) => `$${Number(v)?.toFixed(2)}` },
                            { key: 'total', label: 'Total ($)', render: (_: any, row: any) => `$${(row.stockActual * row.costoPromedio).toFixed(2)}` }
                        ]}
                    />
                </div>
            )}

            {/* History Table */}
            <DataTable
                title="Historial de Cierres"
                columns={columns}
                data={cierres}
                loading={loading}
            />
        </div>
    );
};
