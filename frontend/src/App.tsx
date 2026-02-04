import { useState, useEffect, Suspense, lazy } from 'react';
import { AuthView } from './modules/auth/AuthView';
import {
  LayoutDashboard, Box, Truck, Calendar, ClipboardList, PenTool,
  Settings, Building2, FolderOpen, LogOut, ChevronLeft, ChevronRight,
  UserCircle, FileText, UserCog, Users, Car, Search
} from 'lucide-react';
import { CommandPalette } from './components/CommandPalette';

// Lazy Load Views for Performance
const InventarioView = lazy(() => import('./modules/inventario/InventarioView').then(m => ({ default: m.InventarioView })));
const OperacionesView = lazy(() => import('./modules/operaciones/OperacionesView').then(m => ({ default: m.OperacionesView })));
const PlanificacionView = lazy(() => import('./modules/operaciones/PlanificacionView').then(m => ({ default: m.PlanificacionView })));
const BacklogView = lazy(() => import('./modules/operaciones/BacklogView').then(m => ({ default: m.BacklogView })));
const CatalogosView = lazy(() => import('./modules/catalogos/CatalogosView').then(m => ({ default: m.CatalogosView })));
const AlmacenesView = lazy(() => import('./modules/catalogos/AlmacenesView').then(m => ({ default: m.AlmacenesView })));
const ConsignacionView = lazy(() => import('./modules/consignacion/ConsignacionView').then(m => ({ default: m.ConsignacionView })));
const AuditoriaView = lazy(() => import('./modules/auditoria/AuditoriaView').then(m => ({ default: m.AuditoriaView })));
const ReportesView = lazy(() => import('./modules/reportes/ReportesView').then(m => ({ default: m.ReportesView })));
const TransferenciasView = lazy(() => import('./modules/inventario/TransferenciasView').then(m => ({ default: m.TransferenciasView })));
const SystemUsersView = lazy(() => import('./modules/usuarios/SystemUsersView').then(m => ({ default: m.SystemUsersView })));
const WorkloadView = lazy(() => import('./modules/usuarios/WorkloadView').then(m => ({ default: m.WorkloadView })));
const DashboardView = lazy(() => import('./modules/dashboard/DashboardView').then(m => ({ default: m.DashboardView })));
const VehiculosView = lazy(() => import('./modules/vehiculos/VehiculosView').then(m => ({ default: m.VehiculosView })));
const ActivosView = lazy(() => import('./modules/activos/ActivosView').then(m => ({ default: m.ActivosView })));

const SidebarSection = ({ label, show }: { label: string, show: boolean }) => (
  show ? <div style={{
    fontSize: '0.65rem',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    color: '#94a3b8',
    fontWeight: 800,
    margin: '25px 0 10px 15px'
  }}>{label}</div> : <div style={{ height: '20px' }}></div>
);

const SidebarLink = ({ active, icon: Icon, label, onClick, showLabel }: any) => (
  <li onClick={onClick} style={{
    padding: '12px 15px',
    borderRadius: '12px',
    cursor: 'pointer',
    background: active ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
    color: active ? '#60a5fa' : '#94a3b8',
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    fontWeight: active ? 600 : 400,
    borderLeft: active ? '3px solid #3b82f6' : '3px solid transparent'
  }}>
    <span style={{ width: '24px', display: 'flex', justifyContent: 'center' }}>
      {typeof Icon === 'string' ? Icon : <Icon size={22} strokeWidth={active ? 2.5 : 2} />}
    </span>
    {showLabel && <span style={{ fontSize: '0.9rem' }}>{label}</span>}
  </li>
);

// Fallback Loading Component
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#94a3b8' }}>
    <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid #334155', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
  </div>
);

export default function App() {
  const [user, setUser] = useState<any>(null);
  // State for responsive design
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [view, setView] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'dashboard';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setIsSidebarOpen(true);
      else setIsSidebarOpen(false);
    };

    window.addEventListener('resize', handleResize);
    const savedUser = localStorage.getItem('inv_user');
    if (savedUser && savedUser !== 'undefined' && savedUser !== 'null') {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('inv_user');
      }
    }
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard shortcut for Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update URL when view changes & Listen to external hash changes
  useEffect(() => {
    // 1. Sync URL with current View state (if different)
    const currentHash = window.location.hash.replace('#', '');
    if (currentHash !== view) {
      window.location.hash = view;
    }

    // 2. Auto-close sidebar on mobile
    if (isMobile) setIsSidebarOpen(false);

    // 3. Listen to browser Back/Forward buttons (Hash change)
    const handleHashChange = () => {
      const newHash = window.location.hash.replace('#', '');
      // Only update view if it's different to prevent loops
      if (newHash && newHash !== view) {
        setView(newHash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [view, isMobile]);

  if (!user) return <AuthView onLogin={setUser} />;

  const handleLogout = () => {
    localStorage.removeItem('inv_token');
    localStorage.removeItem('inv_user');
    window.location.href = '/'; // Force reload/redirect to clear state
  };

  const roleName = (user.rolNombre || '').toUpperCase();
  const isAdmin = roleName === 'ADMIN' || roleName === 'ADMINISTRADOR';
  const isSupervisor = roleName === 'DESPACHO' || roleName === 'SUPERVISOR';
  const isBodega = roleName === 'BODEGA';
  const isTecnico = roleName === 'TECNICO';

  const renderView = () => {
    switch (view) {
      case 'dashboard': return <DashboardView user={user} onNavigate={setView} />;
      case 'planificacion': return <PlanificacionView />;
      case 'backlog': return <BacklogView />;
      case 'inventario': return <InventarioView />;
      case 'transferencias': return <TransferenciasView />;
      case 'operaciones': return <OperacionesView />;
      case 'catalogos': return <CatalogosView />;
      case 'almacenes': return <AlmacenesView />;
      case 'consignacion': return <ConsignacionView />;
      case 'auditoria': return <AuditoriaView />;
      case 'reportes': return <ReportesView />;
      case 'activos': return <ActivosView />;
      case 'usuarios': return <SystemUsersView />;
      case 'sys-users': return <SystemUsersView />;
      case 'workload': return <WorkloadView />;
      case 'vehiculos': return <VehiculosView />;
      default: return <DashboardView user={user} onNavigate={setView} />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-dark)', overflow: 'hidden' }}>
      {/* Overlay for mobile when sidebar is open */}
      {isMobile && isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            zIndex: 99, animation: 'fadeIn 0.2s'
          }}
        />
      )}

      <nav style={{
        width: isSidebarOpen ? (isMobile ? '85%' : '280px') : (isMobile ? '0' : '80px'),
        position: isMobile ? 'fixed' : 'relative',
        left: 0, top: 0, bottom: 0,
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border)',
        padding: isMobile && !isSidebarOpen ? '25px 0' : '25px 15px',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex', flexDirection: 'column',
        zIndex: 100,
        overflow: isMobile && !isSidebarOpen ? 'hidden' : 'visible'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '40px', paddingLeft: '10px' }}>
          <div style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg, var(--primary), var(--accent))', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#fff', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)' }}>I</div>
          {(isSidebarOpen || !isMobile) && <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-1.5px', color: '#fff' }}>INVCORE</span>}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }} className="custom-scroll">
          <SidebarLink active={view === 'dashboard'} icon={LayoutDashboard} label="Inicio" onClick={() => setView('dashboard')} showLabel={isSidebarOpen || !isMobile} />

          {(isAdmin || isBodega || isSupervisor) && (
            <>
              <SidebarSection label="Inventario" show={isSidebarOpen || !isMobile} />
              <SidebarLink active={view === 'inventario'} icon={Box} label="Stock Global" onClick={() => setView('inventario')} showLabel={isSidebarOpen || !isMobile} />
              <SidebarLink active={view === 'transferencias'} icon={Truck} label="Traslados" onClick={() => setView('transferencias')} showLabel={isSidebarOpen || !isMobile} />
              <SidebarLink active={view === 'consignacion'} icon={Settings} label="Consignaciones" onClick={() => setView('consignacion')} showLabel={isSidebarOpen || !isMobile} />
            </>
          )}

          {(isAdmin || isSupervisor || isTecnico) && (
            <>
              <SidebarSection label="Operaciones" show={isSidebarOpen || !isMobile} />
              {(isAdmin || isSupervisor) && <SidebarLink active={view === 'planificacion'} icon={Calendar} label="Planificación" onClick={() => setView('planificacion')} showLabel={isSidebarOpen || !isMobile} />}
              {(isAdmin || isSupervisor) && <SidebarLink active={view === 'backlog'} icon={ClipboardList} label="Backlog OTs" onClick={() => setView('backlog')} showLabel={isSidebarOpen || !isMobile} />}
              <SidebarLink active={view === 'operaciones'} icon={ClipboardList} label={isTecnico ? "Mis Órdenes" : "Órdenes OT"} onClick={() => setView('operaciones')} showLabel={isSidebarOpen || !isMobile} />
              {(isAdmin || isSupervisor) && <SidebarLink active={view === 'reportes'} icon={FileText} label="Reportes y KPIs" onClick={() => setView('reportes')} showLabel={isSidebarOpen || !isMobile} />}
              {isTecnico && <SidebarLink active={view === 'activos'} icon={PenTool} label="Mis Herramientas" onClick={() => setView('activos')} showLabel={isSidebarOpen || !isMobile} />}
              {isTecnico && <SidebarLink active={view === 'transferencias'} icon={Truck} label="Traslados / Pedidos" onClick={() => setView('transferencias')} showLabel={isSidebarOpen || !isMobile} />}
            </>
          )}

          {isAdmin && (
            <>
              <SidebarSection label="Sistema" show={isSidebarOpen || !isMobile} />

              <SidebarLink active={view === 'workload'} icon={Users} label="Carga de Trabajo" onClick={() => setView('workload')} showLabel={isSidebarOpen || !isMobile} />
              <SidebarLink active={view === 'vehiculos'} icon={Car} label="Control Flota" onClick={() => setView('vehiculos')} showLabel={isSidebarOpen || !isMobile} />
              <SidebarLink active={view === 'sys-users'} icon={UserCog} label="Usuarios" onClick={() => setView('sys-users')} showLabel={isSidebarOpen || !isMobile} />
              <SidebarLink active={view === 'activos'} icon={Settings} label="Activos y Herramientas" onClick={() => setView('activos')} showLabel={isSidebarOpen || !isMobile} />
              <SidebarLink active={view === 'almacenes'} icon={Building2} label="Almacenes" onClick={() => setView('almacenes')} showLabel={isSidebarOpen || !isMobile} />
              <SidebarLink active={view === 'catalogos'} icon={FolderOpen} label="Catálogos" onClick={() => setView('catalogos')} showLabel={isSidebarOpen || !isMobile} />
            </>
          )}
        </div>

        {(isSidebarOpen || !isMobile) && (
          <div style={{ padding: '20px 5px', borderTop: '1px solid var(--border)', marginTop: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                <UserCircle size={24} />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user.nombre}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user.rolNombre}</div>
              </div>
            </div>
            <button onClick={handleLogout} className="btn-logout" style={{ width: '100%', padding: '10px', borderRadius: '10px', background: 'transparent', border: '1px solid var(--border)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <LogOut size={18} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        )}
      </nav>

      <main style={{
        flex: 1,
        padding: isMobile ? '20px 15px' : '30px 40px',
        overflowY: 'auto',
        position: 'relative',
        paddingTop: isMobile ? '70px' : '30px'
      }}>
        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          style={{
            position: 'fixed',
            left: isMobile ? '15px' : (isSidebarOpen ? '265px' : '65px'),
            top: isMobile ? '15px' : '30px',
            zIndex: 101,
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'var(--primary)',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.5)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {isSidebarOpen && !isMobile ? <ChevronLeft size={20} /> : (isMobile && isSidebarOpen ? <ChevronLeft size={24} /> : (isMobile ? <ClipboardList size={24} /> : <ChevronRight size={20} />))}
        </button>

        {/* Floating Search Trigger (Mobile/Desktop) */}
        <button
          onClick={() => setIsPaletteOpen(true)}
          style={{
            position: 'fixed',
            right: '30px',
            bottom: '30px',
            width: '56px',
            height: '56px',
            borderRadius: '28px',
            background: '#1e293b',
            border: '1px solid #334155',
            color: '#fff',
            boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }}
          title="Abrir Comandos (Ctrl+K)"
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Search size={24} />
        </button>

        <div style={{ maxWidth: '1400px', margin: '0 auto', animation: 'fadeIn 0.5s' }}>
          <Suspense fallback={<PageLoader />}>
            {renderView()}
          </Suspense>
        </div>
      </main>

      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onNavigate={(v) => { setView(v); setIsPaletteOpen(false); }}
      />
    </div>
  );
}
