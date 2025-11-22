export interface NotionSource {
    id: string;
    title: string;
    type: 'page' | 'database';
    icon?: string;
    lastEdited?: string;
}

export interface SummarizeRequest {
    youtubeUrl: string;
    language: string;
    targetSourceId: string;
    targetSourceType: 'page' | 'database';
}

export const SUPPORTED_LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Spanish' },
    { code: 'fr', label: 'French' },
    { code: 'de', label: 'German' },
    { code: 'pt', label: 'Portuguese' },
    { code: 'ja', label: 'Japanese' },
    { code: 'ko', label: 'Korean' },
    { code: 'zh', label: 'Chinese' },
    { code: 'ar', label: 'Arabic' },
    { code: 'auto', label: 'Auto-detect' },
] as const;