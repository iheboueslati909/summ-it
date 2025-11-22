'use client';

import { useState, useEffect } from 'react';
import { NotionSource } from '@/types';

interface NotionSourceSelectorProps {
    value: NotionSource | null;
    onChange: (source: NotionSource | null) => void;
}

export function NotionSourceSelector({ value, onChange }: NotionSourceSelectorProps) {
    const [sources, setSources] = useState<NotionSource[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchSources();
    }, []);

    async function fetchSources() {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/notion/sources');
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to load');
            }

            setSources(data.sources);

            // Auto-select first database if available
            if (data.sources.length > 0 && !value) {
                const firstDb = data.sources.find((s: NotionSource) => s.type === 'database');
                onChange(firstDb || data.sources[0]);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load sources');
        } finally {
            setLoading(false);
        }
    }

    function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const selected = sources.find(s => s.id === e.target.value);
        onChange(selected || null);
    }

    // Loading state
    if (loading) {
        return (
            <div style={styles.container}>
                <label style={styles.label}>Save to Notion</label>
                <div style={styles.loading}>
                    <span style={styles.spinner} />
                    Loading your pages...
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div style={styles.container}>
                <label style={styles.label}>Save to Notion</label>
                <div style={styles.errorBox}>
                    <span>{error}</span>
                    <button onClick={fetchSources} style={styles.retryBtn}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Empty state
    if (sources.length === 0) {
        return (
            <div style={styles.container}>
                <label style={styles.label}>Save to Notion</label>
                <div style={styles.emptyBox}>
                    <p style={styles.emptyText}>
                        No pages shared with this integration.
                    </p>
                    <a
                        href="https://notion.so"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.addLink}
                    >
                        + Share a page in Notion
                    </a>
                    <button onClick={fetchSources} style={styles.refreshBtn}>
                        Refresh
                    </button>
                </div>
            </div>
        );
    }

    // Normal state with sources
    return (
        <div style={styles.container}>
            <label style={styles.label}>Save to Notion</label>
            <select
                value={value?.id || ''}
                onChange={handleChange}
                style={styles.select}
            >
                <option value="" disabled>Select a page or database</option>

                {/* Databases first */}
                {sources.filter(s => s.type === 'database').length > 0 && (
                    <optgroup label="Databases">
                        {sources.filter(s => s.type === 'database').map(source => (
                            <option key={source.id} value={source.id}>
                                {source.icon || '📊'} {source.title}
                            </option>
                        ))}
                    </optgroup>
                )}

                {/* Then pages */}
                {sources.filter(s => s.type === 'page').length > 0 && (
                    <optgroup label="Pages">
                        {sources.filter(s => s.type === 'page').map(source => (
                            <option key={source.id} value={source.id}>
                                {source.icon || '📄'} {source.title}
                            </option>
                        ))}
                    </optgroup>
                )}
            </select>

            <span style={styles.hint}>
                {value?.type === 'database'
                    ? 'A new entry will be created in this database'
                    : 'Content will be appended to this page'}
            </span>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    container: { display: 'flex', flexDirection: 'column', gap: '0.35rem' },
    label: { fontSize: '0.85rem', fontWeight: 500, color: '#374151' },
    select: {
        padding: '0.65rem 0.85rem',
        fontSize: '0.95rem',
        border: '1px solid #ddd',
        borderRadius: '6px',
        background: '#fff',
        cursor: 'pointer',
    },
    hint: { fontSize: '0.75rem', color: '#6b7280' },
    loading: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.65rem 0.85rem',
        fontSize: '0.9rem',
        color: '#6b7280',
        background: '#f9fafb',
        borderRadius: '6px',
    },
    spinner: {
        width: '14px',
        height: '14px',
        border: '2px solid #e5e7eb',
        borderTopColor: '#6b7280',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
    },
    errorBox: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.65rem 0.85rem',
        fontSize: '0.85rem',
        color: '#dc2626',
        background: '#fef2f2',
        borderRadius: '6px',
    },
    retryBtn: {
        padding: '0.25rem 0.5rem',
        fontSize: '0.8rem',
        color: '#dc2626',
        background: 'transparent',
        border: '1px solid #fca5a5',
        borderRadius: '4px',
        cursor: 'pointer',
    },
    emptyBox: {
        padding: '1rem',
        background: '#f9fafb',
        borderRadius: '6px',
        textAlign: 'center',
    },
    emptyText: {
        margin: 0,
        fontSize: '0.85rem',
        color: '#6b7280',
    },
    addLink: {
        display: 'inline-block',
        marginTop: '0.5rem',
        fontSize: '0.85rem',
        color: '#2563eb',
        textDecoration: 'none',
    },
    refreshBtn: {
        display: 'block',
        margin: '0.5rem auto 0',
        padding: '0.25rem 0.75rem',
        fontSize: '0.8rem',
        color: '#374151',
        background: '#fff',
        border: '1px solid #d1d5db',
        borderRadius: '4px',
        cursor: 'pointer',
    },
};
