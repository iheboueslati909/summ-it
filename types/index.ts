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
    outputType: 'notion' | 'pdf';
    targetSourceId?: string;
    targetSourceType?: 'page' | 'database';
    summaryType?: string;
    useIcons?: boolean;
}

export interface PDFSummaryResponse {
    pdfData: string; // base64 encoded PDF
    title: string;
    videoUrl: string;
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

export type TranscriptChunk = {
    text: string;
    offset?: number;
    duration?: number;
    lang?: string;
};

export interface TranscriptResult {
    content: string | TranscriptChunk[];
    lang: string;
    availableLangs: string[];
}