import React, { useState } from 'react';
import { alertSuccess, alertError } from '../../services/alert.service';
import { authService } from '../../services/api.service';

export const AuthView = ({ onLogin }: { onLogin: (user: any) => void }) => {
    const [correo, setCorreo] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await authService.login(correo, password);
            // El backend devuelve { success, data, statusCode ... }
            const loginData = res.data.data || res.data;

            if (loginData.access_token || loginData.token) {
                const token = loginData.access_token || loginData.token;
                localStorage.setItem('inv_token', token);
                localStorage.setItem('inv_user', JSON.stringify(loginData.user));
                alertSuccess('Bienvenido al sistema');
                onLogin(loginData.user);
            } else {
                console.error('Login Response Data:', loginData);
                alertError('Error', 'No se recibió el token de acceso');
            }
        } catch (err: any) {
            alertError('Error de acceso', err.response?.data?.message || 'Credenciales inválidas');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <form className="card animate-fade" onSubmit={handleLogin} style={{
                width: '100%',
                maxWidth: '420px',
                padding: 'min(48px, 8vw)',
                position: 'relative'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '14px'
                    }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                            borderRadius: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '22px',
                            color: '#fff',
                            fontWeight: 900,
                            boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)'
                        }}>I</div>
                        <h2 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-2px', margin: 0, color: '#fff' }}>INVCORE</h2>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 400 }}>
                        Plataforma de Control Inteligente
                    </p>
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Correo o Carnet
                    </label>
                    <input
                        type="text"
                        required
                        value={correo}
                        onChange={(e) => setCorreo(e.target.value)}
                        style={{ width: '100%' }}
                        placeholder="ej. usuario@empresa.com o C12345"
                    />
                </div>

                <div style={{ marginBottom: '32px' }}>
                    <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Contraseña
                    </label>
                    <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ width: '100%' }}
                        placeholder="••••••••"
                    />
                </div>

                <button
                    disabled={loading}
                    className="btn-primary"
                    style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
                >
                    {loading ? 'Verificando...' : 'Acceder al Sistema'}
                </button>

                <div style={{ marginTop: '30px', textAlign: 'center' }}>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                        &copy; 2026 INVCORE Systems • v2.0
                    </span>
                </div>
            </form>
        </div>
    );
};
