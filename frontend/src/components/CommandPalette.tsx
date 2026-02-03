import { useState, useEffect, useRef } from 'react';
import { Search, ArrowRight, LayoutDashboard, ClipboardList, Box, PenTool, Truck, FileText } from 'lucide-react';

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (view: string) => void;
}

export const CommandPalette = ({ isOpen, onClose, onNavigate }: CommandPaletteProps) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const commands = [
        { id: 'dashboard', label: 'Ir a Inicio', icon: LayoutDashboard, type: 'navigation', view: 'dashboard' },
        { id: 'operaciones', label: 'Ir a Operaciones / OTs', icon: ClipboardList, type: 'navigation', view: 'operaciones' },
        { id: 'inventario', label: 'Ver Inventario Global', icon: Box, type: 'navigation', view: 'inventario' },
        { id: 'activos', label: 'Rastrear Activos', icon: PenTool, type: 'navigation', view: 'activos' },
        { id: 'transferencias', label: 'Traslados y Pedidos', icon: Truck, type: 'navigation', view: 'transferencias' },
        { id: 'reportes', label: 'Ver Reportes', icon: FileText, type: 'navigation', view: 'reportes' },
    ];

    const filteredCommands = commands.filter(cmd =>
        cmd.label.toLowerCase().includes(query.toLowerCase())
    );

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
            setQuery('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredCommands[selectedIndex]) {
                    handleSelect(filteredCommands[selectedIndex]);
                }
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, filteredCommands, selectedIndex]);

    const handleSelect = (command: any) => {
        if (command.type === 'navigation') {
            onNavigate(command.view);
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                zIndex: 9999, display: 'flex', alignItems: 'start', justifyContent: 'center',
                paddingTop: '15vh'
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    width: '100%', maxWidth: '600px',
                    background: '#1e293b',
                    borderRadius: '16px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    border: '1px solid #334155',
                    overflow: 'hidden',
                    animation: 'scaleIn 0.2s ease-out'
                }}
            >
                <div style={{ padding: '16px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Search color="#94a3b8" />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
                        placeholder="Escribe un comando o busca una vista (Ctrl+K)..."
                        style={{
                            background: 'transparent', border: 'none', color: '#fff', fontSize: '1.1rem',
                            flex: 1, outline: 'none'
                        }}
                    />
                    <div style={{ fontSize: '0.75rem', color: '#64748b', border: '1px solid #334155', padding: '2px 6px', borderRadius: '4px' }}>ESC</div>
                </div>

                <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '8px' }}>
                    {filteredCommands.length === 0 ? (
                        <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                            No se encontraron resultados
                        </div>
                    ) : (
                        filteredCommands.map((cmd, index) => (
                            <div
                                key={cmd.id}
                                onClick={() => handleSelect(cmd)}
                                onMouseEnter={() => setSelectedIndex(index)}
                                style={{
                                    padding: '12px 16px',
                                    display: 'flex', alignItems: 'center', gap: '15px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    background: index === selectedIndex ? '#3b82f6' : 'transparent',
                                    color: index === selectedIndex ? '#fff' : '#cbd5e1',
                                    transition: 'all 0.1s'
                                }}
                            >
                                <cmd.icon size={20} />
                                <span style={{ flex: 1 }}>{cmd.label}</span>
                                {index === selectedIndex && <ArrowRight size={16} />}
                            </div>
                        ))
                    )}
                </div>

                <div style={{ padding: '8px 16px', background: '#0f172a', borderTop: '1px solid #334155', fontSize: '0.75rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Navegación Rápida</span>
                    <span>INVCORE v2.0 Enterprise</span>
                </div>
            </div>
        </div>
    );
};
