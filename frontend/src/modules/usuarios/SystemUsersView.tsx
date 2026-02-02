import { useState, useEffect } from 'react';
import { authService, invService, opeService } from '../../services/api.service';
import { DataTable } from '../../components/DataTable';
import { Modal } from '../../components/Modal';
import { alertSuccess, alertError } from '../../services/alert.service';
import { Plus, Shield, History, PenTool, Search, UserCircle } from 'lucide-react';

export const SystemUsersView = () => {
    // State
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Profile Modal State
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [profileOpen, setProfileOpen] = useState(false);
    const [userTools, setUserTools] = useState<any[]>([]);
    const [userHistory, setUserHistory] = useState<any[]>([]);
    const [loadingProfile, setLoadingProfile] = useState(false);

    const [form, setForm] = useState({
        nombre: '',
        correo: '',
        password: '',
        carnet: '',
        idRol: 3
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const res = await authService.getUsers();
            // Data can be in res.data (unwrapped), res.data.data (wrapped by interceptor), 
            // or even res.data.data.data (Legacy double-wrapping)
            let rawData = res.data;
            if (rawData && rawData.data) rawData = rawData.data;
            if (rawData && rawData.data) rawData = rawData.data; // Double deep for safety

            let data = Array.isArray(rawData) ? rawData : [];

            // Clean nulls
            data = data.filter((u: any) => u !== null && u !== undefined);

            setUsers(data);
        } catch (error: any) {
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                setUsers([]);
                return;
            }
            console.error('Error loading users:', error);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await authService.createUser(form);
            alertSuccess('Usuario creado correctamente');
            setIsCreateModalOpen(false);
            setForm({ nombre: '', correo: '', password: '', carnet: '', idRol: 3 });
            loadUsers();
        } catch (error) {
            console.error(error);
            alertError('Error al crear usuario');
        }
    };

    const handleToggleStatus = async (user: any) => {
        if (!confirm(`¿${user.activo ? 'Desactivar' : 'Activar'} a ${user.nombre}?`)) return;
        try {
            await authService.toggleUserStatus(user.idUsuario, !user.activo);
            loadUsers();
            alertSuccess('Estado actualizado');
        } catch (err) {
            alertError('Error al cambiar estado');
        }
    };

    const handleOpenProfile = async (user: any) => {
        setSelectedUser(user);
        setProfileOpen(true);
        setLoadingProfile(true);
        try {
            // Fetch Tools
            const assetsRes = await invService.getActivos();
            let assetsRaw = assetsRes.data?.data || assetsRes.data || [];
            if (assetsRaw.data) assetsRaw = assetsRaw.data; // Safety deep extraction

            const allAssets = Array.isArray(assetsRaw) ? assetsRaw : [];
            const myTools = allAssets.filter((a: any) => a.idTecnicoActual === user.idUsuario);
            setUserTools(myTools);

            // Fetch History
            const otsRes = await opeService.listarOTs({ idTecnico: user.idUsuario });
            let otsRaw = otsRes.data?.data || otsRes.data || [];
            if (otsRaw.data) otsRaw = otsRaw.data;

            const myOts = Array.isArray(otsRaw) ? otsRaw : [];
            setUserHistory(myOts);

        } catch (err) {
            console.error(err);
        } finally {
            setLoadingProfile(false);
        }
    };

    // Columns Definition
    const columns = [
        {
            key: 'idUsuario',
            label: 'ID',
            render: (val: any) => <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>#{val}</span>
        },
        {
            key: 'nombre',
            label: 'Usuario / Identificador',
            render: (val: string, row: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '36px', height: '36px',
                        borderRadius: '10px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--primary)'
                    }}>
                        <UserCircle size={20} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, color: row.activo ? '#e2e8f0' : '#94a3b8' }}>{val}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{row.carnet || 'Sin Carnet'}</div>
                    </div>
                </div>
            )
        },
        {
            key: 'rolNombre',
            label: 'Perfil / Permisos',
            render: (val: string) => {
                const colors: any = {
                    'ADMIN': { bg: 'rgba(239, 68, 68, 0.1)', text: '#f87171' },
                    'TECNICO': { bg: 'rgba(16, 185, 129, 0.1)', text: '#34d399' },
                    'SUPERVISOR': { bg: 'rgba(245, 158, 11, 0.1)', text: '#fbbf24' },
                    'BODEGA': { bg: 'rgba(99, 102, 241, 0.1)', text: '#818cf8' }
                };
                const style = colors[val?.toUpperCase()] || { bg: 'rgba(255,255,255,0.05)', text: '#94a3b8' };
                return (
                    <span className="badge" style={{ background: style.bg, color: style.text, border: `1px solid ${style.text}22` }}>
                        {val || 'Usuario'}
                    </span>
                );
            }
        },
        { key: 'correo', label: 'Correo' },
        {
            key: 'actions',
            label: 'Opciones',
            render: (_: any, row: any) => {
                if (!row) return null;
                return (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            className="btn-secondary"
                            onClick={() => handleOpenProfile(row)}
                            title="Ver Perfil Detallado"
                            style={{ padding: '8px', borderRadius: '10px' }}
                        >
                            <Search size={16} />
                        </button>
                        <button
                            className={row.activo ? 'btn-danger' : 'btn-primary'}
                            onClick={() => handleToggleStatus(row)}
                            title={row.activo ? 'Desactivar Usuario' : 'Activar Usuario'}
                            style={{ padding: '8px', borderRadius: '10px' }}
                        >
                            <Shield size={16} />
                        </button>
                    </div>
                );
            }
        }
    ];

    return (
        <div className="animate-fade">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>Directorio de Usuarios</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Gestión de accesos, roles y perfiles técnicos</p>
                </div>
                <button className="btn-primary" onClick={() => setIsCreateModalOpen(true)}>
                    <Plus size={18} style={{ marginRight: '8px' }} />
                    Nuevo Usuario
                </button>
            </div>

            <div className="card" style={{ padding: '0' }}>
                <DataTable
                    columns={columns}
                    data={users}
                    loading={loading}
                    title="" // Hidden title since we have a custom header
                />
            </div>

            {/* CREATE USER MODAL */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Registrar Nuevo Usuario"
            >
                <form onSubmit={handleCreate}>
                    <div className="form-group">
                        <label className="form-label">Nombre Completo</label>
                        <input className="form-input" required value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Correo Electrónico</label>
                        <input className="form-input" required type="email" value={form.correo} onChange={e => setForm({ ...form, correo: e.target.value })} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div className="form-group">
                            <label className="form-label">Carnet / ID Empleado</label>
                            <input className="form-input" value={form.carnet} onChange={e => setForm({ ...form, carnet: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Rol de Acceso</label>
                            <select className="form-input" value={form.idRol} onChange={e => setForm({ ...form, idRol: Number(e.target.value) })}>
                                <option value={3}>Técnico</option>
                                <option value={2}>Supervisor</option>
                                <option value={4}>Bodega</option>
                                <option value={1}>Administrador</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Contraseña Temporal</label>
                        <input className="form-input" required type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                    </div>

                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" className="btn-secondary" onClick={() => setIsCreateModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="btn-primary">Guardar Usuario</button>
                    </div>
                </form>
            </Modal>

            {/* PROFILE MODAL */}
            <Modal
                isOpen={profileOpen}
                onClose={() => setProfileOpen(false)}
                title={`Ficha: ${selectedUser?.nombre || 'Usuario'}`}
                width="800px"
            >
                <div style={{ display: 'grid', gap: '25px' }}>
                    {/* Tools Section */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
                            <PenTool size={18} color="var(--accent)" />
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Herramientas Asignadas</h3>
                        </div>

                        {loadingProfile ? <p>Cargando...</p> : userTools.length === 0 ? (
                            <div style={{ padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', color: '#94a3b8', fontSize: '0.9rem' }}>
                                Sin herramientas asignadas actualmente.
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                                {userTools.map((t, i) => (
                                    <div key={i} style={{ padding: '12px', background: '#1e293b', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#e2e8f0' }}>{t.productoNombre}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '4px' }}>S/N: {t.serial}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* History Section */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
                            <History size={18} color="#10b981" />
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Historial de Servicios</h3>
                        </div>

                        {loadingProfile ? <p>Cargando...</p> : userHistory.length === 0 ? (
                            <div style={{ padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', color: '#94a3b8', fontSize: '0.9rem' }}>
                                No registra actividad reciente.
                            </div>
                        ) : (
                            <div className="custom-scroll" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', color: '#94a3b8', borderBottom: '1px solid var(--border)' }}>
                                            <th style={{ padding: '8px' }}>OT</th>
                                            <th style={{ padding: '8px' }}>Fecha</th>
                                            <th style={{ padding: '8px' }}>Cliente</th>
                                            <th style={{ padding: '8px' }}>Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {userHistory.map((h, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td style={{ padding: '8px', fontWeight: 600 }}>#{h.idOT}</td>
                                                <td style={{ padding: '8px' }}>{new Date(h.fechaCreacion).toLocaleDateString()}</td>
                                                <td style={{ padding: '8px' }}>{h.clienteNombre}</td>
                                                <td style={{ padding: '8px' }}><span className="badge">{h.estado}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
}
