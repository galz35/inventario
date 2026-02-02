import { useState, useEffect } from 'react';
import { invService } from '../../services/api.service';
import { DataTable } from '../../components/DataTable';
import { alertSuccess, alertConfirm } from '../../services/alert.service';

export const AuditoriaView = () => {
    const [conteos, setConteos] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchConteos = async () => {
        setLoading(true);
        try {
            const res = await invService.getConteos();
            setConteos(res.data.data || res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConteos();
    }, []);

    const columns = [
        { key: 'idConteo', label: 'Folio', render: (val: any) => `AUD-${val}` },
        { key: 'almacenNombre', label: 'Almacén' },
        { key: 'fechaInicio', label: 'Fecha Inicio' },
        { key: 'responsableNombre', label: 'Auditor' },
        {
            key: 'estado',
            label: 'Estado',
            render: (val: string) => (
                <span className={`badge ${val === 'FINALIZADO' ? 'badge-success' : 'badge-warning'}`}>
                    {val}
                </span>
            )
        }
    ];

    const handleNewAudit = async () => {
        const confirm = await alertConfirm('¿Iniciar Auditoría?', 'Este proceso inmovilizará administrativamente el stock del almacén seleccionado.');
        if (confirm.isConfirmed) {
            alertSuccess('Auditoría iniciada correctamente');
        }
    };

    return (
        <DataTable
            title="Auditoría de Stock"
            description="Conteos físicos y conciliación de existencias."
            columns={columns}
            data={conteos}
            loading={loading}
            actions={<button className="btn-primary" onClick={handleNewAudit}>+ Iniciar Conteo Físico</button>}
        />
    );
};
