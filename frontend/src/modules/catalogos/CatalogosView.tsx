import { useState, useEffect } from 'react';
import { invService } from '../../services/api.service';
import { DataTable } from '../../components/DataTable';
import { Modal } from '../../components/Modal';
import { alertSuccess, alertError } from '../../services/alert.service';

export const CatalogosView = () => {
    const [activeTab, setActiveTab] = useState<'categorias' | 'proveedores' | 'productos'>('productos');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Form States
    const [formData, setFormData] = useState<any>({ nombre: '', codigo: '', esSerializado: false, costo: 0, idCategoria: '' });

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await invService.getCatalog(activeTab);
            setData(res.data.data || res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        try {
            await invService.saveCatalog(activeTab, formData);
            alertSuccess('Registro guardado correctamente');
            setIsModalOpen(false);
            fetchData();
        } catch (err: any) {
            alertError('Error al guardar', err.response?.data?.message || 'Contacte al administrador');
        } finally {
            setProcessing(false);
        }
    };

    const productColumns = [
        { key: 'codigo', label: 'Código' },
        { key: 'nombre', label: 'Nombre' },
        { key: 'categoriaNombre', label: 'Categoría' },
        { key: 'unidad', label: 'Unidad' },
        {
            key: 'costo',
            label: 'Costo',
            render: (val: number) => <span style={{ fontWeight: 600 }}>${val.toFixed(2)}</span>
        },
        {
            key: 'esSerializado',
            label: 'Tipo',
            render: (val: boolean) => (
                <span className={`badge ${val ? 'badge-accent' : 'badge-success'}`}>
                    {val ? 'Serializado' : 'Consumible'}
                </span>
            )
        }
    ];

    const providerColumns = [
        { key: 'nombre', label: 'Nombre' },
        { key: 'nit', label: 'NIT' },
        { key: 'contacto', label: 'Contacto' },
        { key: 'correo', label: 'Correo' },
        { key: 'telefono', label: 'Teléfono' }
    ];

    const categoryColumns = [
        { key: 'nombre', label: 'Nombre' },
        { key: 'descripcion', label: 'Descripción' }
    ];

    const getColumns = () => {
        if (activeTab === 'productos') return productColumns;
        if (activeTab === 'proveedores') return providerColumns;
        return categoryColumns;
    };

    return (
        <div>

            <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '20px',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '10px',
                overflowX: 'auto',
                whiteSpace: 'nowrap',
                scrollbarWidth: 'none' // Hide scrollbar for cleaner look
            }} className="no-scrollbar">
                <TabButton active={activeTab === 'productos'} onClick={() => setActiveTab('productos')}>Productos</TabButton>
                <TabButton active={activeTab === 'proveedores'} onClick={() => setActiveTab('proveedores')}>Proveedores</TabButton>
                <TabButton active={activeTab === 'categorias'} onClick={() => setActiveTab('categorias')}>Categorías</TabButton>
            </div>

            <DataTable
                title={`Catálogo de ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
                description={`Administración maestra de ${activeTab} en el sistema.`}
                columns={getColumns()}
                data={data}
                loading={loading}
                allowExport={true}
                actions={<button className="btn-primary" onClick={() => setIsModalOpen(true)}>+ Nuevo {activeTab.slice(0, -1)}</button>}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`Nuevo ${activeTab.slice(0, -1)}`}
                footer={<>
                    <button className="btn-secondary" onClick={() => setIsModalOpen(false)} disabled={processing}>Cancelar</button>
                    <button className="btn-primary" onClick={handleSubmit} disabled={processing}>{processing ? 'Guardando...' : 'Guardar Cambios'}</button>
                </>}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <FormGroup label="Nombre">
                        <input type="text" className="form-input" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} />
                    </FormGroup>

                    {activeTab === 'productos' && (
                        <>
                            <FormGroup label="Código">
                                <input type="text" className="form-input" value={formData.codigo} onChange={e => setFormData({ ...formData, codigo: e.target.value })} />
                            </FormGroup>
                            <div style={{ display: 'flex', gap: '20px' }}>
                                <FormGroup label="Costo" style={{ flex: 1 }}>
                                    <input type="number" className="form-input" value={formData.costo} onChange={e => setFormData({ ...formData, costo: Number(e.target.value) })} />
                                </FormGroup>
                                <FormGroup label="Serializado" style={{ flex: 1 }}>
                                    <select className="form-input" value={formData.esSerializado ? '1' : '0'} onChange={e => setFormData({ ...formData, esSerializado: e.target.value === '1' })}>
                                        <option value="0">No (Consumible)</option>
                                        <option value="1">Sí (Activo Serial)</option>
                                    </select>
                                </FormGroup>
                            </div>
                        </>
                    )}
                </div>
            </Modal>

            <style>{`
                .badge-accent { background: rgba(139, 92, 246, 0.1); color: var(--accent); }
                .form-input {
                    width: 100%;
                    padding: 12px;
                    background: #151515;
                    border: 1px solid var(--border);
                    border-radius: 10px;
                    color: #fff;
                    outline: none;
                    transition: border-color 0.2s;
                }
                .form-input:focus { border-color: var(--primary); }
            `}</style>
        </div>
    );
};

const FormGroup = ({ label, children, style }: any) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', ...style }}>
        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</label>
        {children}
    </div>
);

const TabButton = ({ active, onClick, children }: any) => (
    <button
        onClick={onClick}
        style={{
            background: active ? 'rgba(244, 63, 94, 0.08)' : 'transparent',
            color: active ? 'var(--primary)' : 'var(--text-secondary)',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '10px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontSize: '0.9rem'
        }}
    >
        {children}
    </button>
);
