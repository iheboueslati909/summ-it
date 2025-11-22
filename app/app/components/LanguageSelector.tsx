'use client';

import { SUPPORTED_LANGUAGES } from '@/types';

interface LanguageSelectorProps {
    value: string;
    onChange: (value: string) => void;
}

export function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
    return (
        <div style={styles.container}>
            <label style={styles.label}>Subtitle Language</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={styles.select}
            >
                {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                        {lang.label}
                    </option>
                ))}
            </select>
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
};