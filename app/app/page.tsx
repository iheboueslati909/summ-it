'use client';

import { useState } from 'react';
import { LanguageSelector } from './components/LanguageSelector';
import { NotionSourceSelector } from './components/NotionSourceSelector';
import { NotionSource } from '@/types';
import { YouTubeInput } from './components/YoutubeInput';

export default function AppPage() {
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [language, setLanguage] = useState('auto');
    const [targetSource, setTargetSource] = useState<NotionSource | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isValidUrl = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/.test(youtubeUrl);
    const canSubmit = isValidUrl && targetSource && !isSubmitting;

    async function handleSummarize() {
        if (!canSubmit) return;

        setIsSubmitting(true);

        try {
            // Phase 3 will implement this
            const res = await fetch('/api/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    youtubeUrl,
                    language,
                    targetSourceId: targetSource!.id,
                    targetSourceType: targetSource!.type,
                }),
            });

            if (!res.ok) throw new Error('Failed to summarize');

            const data = await res.json();
            alert(`Summary saved! ${data.notionUrl || ''}`);
            setYoutubeUrl('');

        } catch (err) {
            alert('Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }

    function openNotionSettings() {
        // Opens Notion's connection settings for user to share more pages
        window.open('https://notion.so/my-integrations', '_blank');
    }

    return (
        <main style={styles.main}>
            <div style={styles.card}>
                <h1 style={styles.heading}>Summarize YouTube Video</h1>
                <p style={styles.subheading}>
                    Extract subtitles, generate a summary, and save it to Notion.
                </p>

                <div style={styles.form}>
                    <YouTubeInput
                        value={youtubeUrl}
                        onChange={setYoutubeUrl}
                    />

                    <LanguageSelector
                        value={language}
                        onChange={setLanguage}
                    />

                    <NotionSourceSelector
                        value={targetSource}
                        onChange={setTargetSource}
                    />

                    <div style={styles.actions}>
                        <button
                            onClick={handleSummarize}
                            disabled={!canSubmit}
                            style={{
                                ...styles.primaryBtn,
                                opacity: canSubmit ? 1 : 0.5,
                                cursor: canSubmit ? 'pointer' : 'not-allowed',
                            }}
                        >
                            {isSubmitting ? 'Processing...' : '✨ Summarize'}
                        </button>

                        <button
                            onClick={openNotionSettings}
                            style={styles.secondaryBtn}
                        >
                            + Add more pages
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}

const styles: Record<string, React.CSSProperties> = {
    main: {
        display: 'flex',
        justifyContent: 'center',
        padding: '3rem 1rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    card: {
        width: '100%',
        maxWidth: '480px',
        padding: '2rem',
        background: '#fff',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    },
    heading: {
        margin: 0,
        fontSize: '1.5rem',
        fontWeight: 600,
        color: '#111',
    },
    subheading: {
        margin: '0.5rem 0 1.5rem',
        fontSize: '0.9rem',
        color: '#6b7280',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
    },
    actions: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        marginTop: '0.5rem',
    },
    primaryBtn: {
        padding: '0.75rem 1.25rem',
        fontSize: '0.95rem',
        fontWeight: 500,
        color: '#fff',
        background: '#111',
        border: 'none',
        borderRadius: '8px',
        transition: 'opacity 0.15s',
    },
    secondaryBtn: {
        padding: '0.6rem 1rem',
        fontSize: '0.85rem',
        color: '#374151',
        background: 'transparent',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        cursor: 'pointer',
    },
};