'use client';

import { useRouter } from 'next/navigation';

interface TopBarProps {
    workspaceName?: string;
}

export function TopBar({ workspaceName }: TopBarProps) {
    const router = useRouter();

    async function handleLogout() {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/');
    }

    return (
        <header style={styles.header}>
            <div style={styles.left}>
                <span style={styles.logo}>📺</span>
                <span style={styles.title}>YouTube → Notion</span>
            </div>

            <div style={styles.right}>
                {workspaceName && (
                    <span style={styles.workspace}>{workspaceName}</span>
                )}
                <button onClick={handleLogout} style={styles.logoutBtn}>
                    Disconnect
                </button>
            </div>
        </header>
    );
}

const styles: Record<string, React.CSSProperties> = {
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.75rem 1.5rem',
        background: '#fff',
        borderBottom: '1px solid #e5e5e5',
    },
    left: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    },
    logo: { fontSize: '1.25rem' },
    title: {
        fontWeight: 600,
        fontSize: '0.95rem',
        color: '#111',
    },
    right: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
    },
    workspace: {
        fontSize: '0.85rem',
        color: '#666',
        padding: '0.25rem 0.5rem',
        background: '#f3f4f6',
        borderRadius: '4px',
    },
    logoutBtn: {
        padding: '0.4rem 0.75rem',
        fontSize: '0.8rem',
        color: '#666',
        background: 'transparent',
        border: '1px solid #ddd',
        borderRadius: '4px',
        cursor: 'pointer',
    },
};