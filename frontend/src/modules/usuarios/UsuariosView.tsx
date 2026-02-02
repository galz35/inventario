import { useState, useEffect } from 'react';
import { authService, invService } from '../../services/api.service';
import { DataTable } from '../../components/DataTable';
import { Modal } from '../../components/Modal';
import { alertSuccess, alertError } from '../../services/alert.service';
import { User, Activity, Briefcase, Plus, Shield, ShieldOff, HardHat, TrendingUp } from 'lucide-react';

export const UsuariosView = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [roles, setRoles] = useState<any[]>([]);

    // Stats
    const [stats, setStats] = useState({ total: 0, activos: 0, tecnicos: 0 });

    const [formData, setFormData] = useState({
        nombre: '',
        correo: '',
        carnet: '',
        password: '',
        idRol: 3 // Default Tecnico
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await authService.getUsers();
            const data = res.data.data || res.data || [];
            setUsers(data);

            // Calc Stats
            setStats({
                total: data.length,
                activos: data.filter((u: any) => u.laborActual).length,
                tecnicos: data.filter((u: any) => u.rolNombre?.toUpperCase().includes('TECNICO')).length
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (user: any) => {
        if (!confirm(`¿${user.activo ? 'Desactivar' : 'Activar'} al usuario ${user.nombre}?`)) return;
        try {
            await authService.toggleUserStatus(user.idUsuario, !user.activo);
            alertSuccess('Estado actualizado');
            fetchUsers();
        } catch (e) { alertError('Error al actualizar estado'); }
    };

    const handleCreate = async () => {
        if (!formData.nombre || !formData.correo || !formData.password) return alertError('Datos incompletos');
        try {
            await authService.createUser(formData);
            alertSuccess('Usuario creado exitosamente');
            setIsModalOpen(false);
            setFormData({ nombre: '', correo: '', carnet: '', password: '', idRol: 3 });
            fetchUsers();
        } catch (e: any) {
            alertError('Error al crear usuario', e.response?.data?.message);
        }
    };

    const columns = [
        {
            key: 'nombre',
            label: 'Usuario',
            render: (val: string, row: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: row.activo ? 'var(--primary)' : '#444',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                    }}>
                        {val.charAt(0)}
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, color: row.activo ? '#fff' : '#888' }}>{val}</div>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>{row.carnet || '--'}</div>
                    </div>
                </div>
            )
        },
        { key: 'correo', label: 'Correo' },
        {
            key: 'rolNombre',
            label: 'Rol',
            render: (val: string) => (
                <span className={`badge ${val === 'ADMINISTRADOR' ? 'badge-warning' : 'badge-primary'}`}>
                    {val}
                </span>
            )
        },
        {
            key: 'laborActual',
            label: 'Actividad Actual',
            render: (val: string, row: any) => val ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '0.85rem' }}>
                    <Activity size={14} className="spin-slow" /> En OT: <b>{val}</b>
                </div>
            ) : (
                <span style={{ color: '#555', fontSize: '0.8rem' }}>Disponible / Inactivo</span>
            )
        },
        {
            key: 'otsMes',
            label: 'Rendimiento (30d)',
            render: (val: number) => (
                val > 0 ? <div style={{ fontWeight: 'bold' }}>{val} OTs Finalizadas</div> : <span style={{ color: '#555' }}>--</span>
            )
        },
        {
            key: 'acciones',
            label: 'Acciones',
            render: (_: any, row: any) => (
                <button
                    className={row.activo ? "btn-secondary" : "btn-primary"}
                    style={{ padding: '4px 10px', fontSize: '0.75rem', background: row.activo ? '' : '#10b981' }}
                    onClick={() => handleToggleStatus(row)}
                >
                    {row.activo ? 'Inhabilitar' : 'Activar'}
                </button>
            )
        }
    ];

    return (
        <div className="animate-fade">
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '25px' }}>
                <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <User size={28} color="var(--primary)" />
                    <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Usuarios Totales</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.total}</div>
                    </div>
                </div>
                <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <Activity size={28} color="#10b981" />
                    <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Trabajando Ahora</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.activos}</div>
                    </div>
                </div>
                <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <HardHat size={28} color="#f59e0b" />
                    <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Fuerza Técnica</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.tecnicos}</div>
                    </div>
                </div>
            </div>

            <DataTable
                title="Gestión de Personal y Usuarios"
                description="Administración de cuentas, roles y monitoreo de actividad en tiempo real."
                columns={columns}
                data={users}
                loading={loading}
                actions={
                    <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                        <Plus size={16} style={{ marginRight: '5px' }} /> Nuevo Usuario
                    </button>
                }
            />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Nuevo Usuario"
                footer={<>
                    <button className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                    <button className="btn-primary" onClick={handleCreate}>Crear Usuario</button>
                </>}
            >
                <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label>Nombre Completo</label>
                    <input className="form-input" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                    <div>
                        <label className="form-label">Correo Electrónico</label>
                        <input className="form-input" value={formData.correo} onChange={e => setFormData({ ...formData, correo: e.target.value })} />
                    </div>
                    <div>
                        <label className="form-label">Carnet / ID</label>
                        <input className="form-input" value={formData.carnet} onChange={e => setFormData({ ...formData, carnet: e.target.value })} />
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                    <div>
                        <label className="form-label">Contraseña</label>
                        <input className="form-input" type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                    </div>
                    <div>
                        <label className="form-label">Rol</label>
                        <select className="form-input" value={formData.idRol} onChange={e => setFormData({ ...formData, idRol: parseInt(e.target.value) })}>
                            <option value="3">Técnico</option>
                            <option value="2">Supervisor / Despacho</option>
                            <option value="4">Bodega</option>
                            <option value="1">Administrador</option>
                        </select>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
