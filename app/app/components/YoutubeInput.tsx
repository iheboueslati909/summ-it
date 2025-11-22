'use client';

interface YouTubeInputProps {
    value: string;
    onChange: (value: string) => void;
    error?: string;
}

export function YouTubeInput({ value, onChange, error }: YouTubeInputProps) {
    // Validate YouTube URL pattern
    const isValid = !value || /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/.test(value);

    return (
        <div style={styles.container}>
            <label style={styles.label}>YouTube Video URL</label>
            <input
                type="url"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                style={{
                    ...styles.input,
                    borderColor: error || (!isValid && value) ? '#ef4444' : '#ddd',
                }}
            />
            {(error || (!isValid && value)) && (
                <span style={styles.error}>{error || 'Enter a valid YouTube URL'}</span>
            )}
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    container: { display: 'flex', flexDirection: 'column', gap: '0.35rem' },
    label: { fontSize: '0.85rem', fontWeight: 500, color: '#374151' },
    input: {
        padding: '0.65rem 0.85rem',
        fontSize: '0.95rem',
        border: '1px solid #ddd',
        borderRadius: '6px',
        outline: 'none',
        transition: 'border-color 0.15s',
    },
    error: { fontSize: '0.8rem', color: '#ef4444' },
};