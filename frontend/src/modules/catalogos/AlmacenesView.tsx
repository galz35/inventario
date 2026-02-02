import { useState, useEffect } from 'react';
import { invService } from '../../services/api.service';
import { DataTable } from '../../components/DataTable';

export const AlmacenesView = () => {
    const [almacenes, setAlmacenes] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAlmacenes = async () => {
        setLoading(true);
        try {
            const res = await invService.getAlmacenes();
            setAlmacenes(res.data.data || res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlmacenes();
    }, []);

    const columns = [
        { key: 'nombre', label: 'Nombre Almacén' },
        {
            key: 'tipo',
            label: 'Tipo',
            render: (val: string) => {
                const colors: any = {
                    'CENTRAL': '#10b981',
                    'REGIONAL': '#8b5cf6',
                    'TECNICO': '#f43f5e',
                    'PROYECTO': '#f59e0b'
                };
                return (
                    <span style={{
                        background: `${colors[val]}20`,
                        color: colors[val],
                        padding: '4px 12px',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 700
                    }}>
                        {val}
                    </span>
                );
            }
        },
        { key: 'ubicacion', label: 'Ubicación' },
        { key: 'padreNombre', label: 'Depende de', render: (val: any) => val || <span style={{ color: '#444' }}>- Principal -</span> },
        {
            key: 'activo',
            label: 'Estado',
            render: (val: boolean) => (
                <span className={`badge ${val ? 'badge-success' : 'badge-danger'}`}>
                    {val ? 'Operativo' : 'Inactivo'}
                </span>
            )
        }
    ];

    return (
        <DataTable
            title="Gestión de Almacenes"
            description="Administración de bodegas centrales, regionales y unidades móviles."
            columns={columns}
            data={almacenes}
            loading={loading}
            actions={<button className="btn-primary">+ Nuevo Almacén</button>}
        />
    );
};
