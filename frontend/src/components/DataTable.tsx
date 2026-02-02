import { useState, useMemo, useEffect } from 'react';

interface Column {
    key: string;
    label: string;
    type?: 'text' | 'number' | 'badge' | 'date';
    render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
    columns: Column[];
    data: any[];
    loading?: boolean;
    title?: string;
    description?: string;
    actions?: React.ReactNode;
    allowExport?: boolean;
}

export const DataTable = ({ columns, data, loading, title, description, actions, allowExport = true }: DataTableProps) => {
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);

    const filteredData = useMemo(() => {
        const safeData = Array.isArray(data) ? data : [];
        const filtered = safeData.filter(row => {
            return Object.entries(filters).every(([key, value]) => {
                if (!value) return true;
                const cellValue = String(row[key] || '').toLowerCase();
                return cellValue.includes(value.toLowerCase());
            });
        });
        return filtered;
    }, [data, filters]);

    // Reset current page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredData.slice(start, start + pageSize);
    }, [filteredData, currentPage, pageSize]);

    const totalPages = Math.ceil(filteredData.length / pageSize);

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const exportCSV = () => {
        if (filteredData.length === 0) return;
        const headers = columns.filter(c => c.key !== 'acciones').map(c => c.label);
        const rows = filteredData.map(row =>
            columns.filter(c => c.key !== 'acciones').map(col => `"${row[col.key] || ''}"`).join(",")
        );

        const content = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.join("\n");
        const encodedUri = encodeURI(content);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `export_${title?.replace(/\s+/g, '_') || 'data'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            {(title || description || actions || allowExport) && (
                <div style={{
                    marginBottom: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    flexWrap: 'wrap',
                    gap: '15px'
                }}>
                    <div style={{ flex: '1 1 300px' }}>
                        {title && <h1 style={{ fontSize: 'min(2rem, 7vw)', marginBottom: '8px', lineHeight: 1.1 }}>{title}</h1>}
                        {description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{description}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {allowExport && (
                            <button className="btn-secondary" onClick={exportCSV} style={{ padding: '8px 12px', fontSize: '0.8rem' }}>
                                📊 Exportar
                            </button>
                        )}
                        {actions}
                    </div>
                </div>
            )}

            <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'var(--bg-card)' }}>
                {loading ? (
                    <div style={{ padding: '60px', textAlign: 'center' }}>
                        <div className="spinner"></div>
                        <p style={{ marginTop: '15px', color: 'var(--text-secondary)' }}>Cargando datos...</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#0a0a0a' }}>
                                    {columns.map(col => (
                                        <th key={col.key} style={{ padding: '16px', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                                            <div style={{ marginBottom: '10px', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                                                {col.label}
                                            </div>
                                            <input
                                                type="text"
                                                placeholder={`🔍 Filtrar...`}
                                                value={filters[col.key] || ''}
                                                onChange={(e) => handleFilterChange(col.key, e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px 12px',
                                                    borderRadius: '6px',
                                                    background: '#151515',
                                                    border: '1px solid #2d3748',
                                                    color: '#fff',
                                                    fontSize: '0.8rem',
                                                    outline: 'none'
                                                }}
                                            />
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedData.length === 0 ? (
                                    <tr>
                                        <td colSpan={columns.length} style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                                            No se encontraron registros que coincidan con los filtros.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedData.map((row, i) => (
                                        <tr key={i} className="table-row">
                                            {columns.map(col => (
                                                <td key={col.key} style={{ padding: '16px', borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
                                                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {!loading && filteredData.length > 0 && (
                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px 20px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Mostrando {Math.min(filteredData.length, (currentPage - 1) * pageSize + 1)} a {Math.min(filteredData.length, currentPage * pageSize)} de {filteredData.length} registros
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        >
                            Anterior
                        </button>
                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentPage(i + 1)}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    background: currentPage === i + 1 ? 'var(--primary)' : 'transparent',
                                    color: currentPage === i + 1 ? '#fff' : 'var(--text-secondary)',
                                    fontSize: '0.8rem',
                                    fontWeight: 600
                                }}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            className="btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                .table-row:hover { background: rgba(255,255,255,0.03); transform: scale(1.001); transition: all 0.2s; }
                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid var(--border);
                    border-top: 4px solid var(--primary);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto;
                }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};
