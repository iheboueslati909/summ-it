// lib/youtube/supadata.ts

import { Supadata, SupadataError } from '@supadata/js';

if (!process.env.SUPADATA_API_KEY) {
    throw new Error('SUPADATA_API_KEY is not defined');
}

const supadata = new Supadata({ apiKey: process.env.SUPADATA_API_KEY });

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

export async function getYoutubeTranscript(
    videoUrl: string,
    lang?: string,
    text = true
): Promise<TranscriptResult> {
    try {
        const result = await supadata.transcript({
            url: videoUrl,
            lang,
            text,
            mode: 'auto',     // or choose 'native' / 'generate' depending on your needs :contentReference[oaicite:0]{index=0}
        });

        // If this returned a jobId instead (meaning it's not done yet), handle that
        if ('jobId' in result) {
            // Poll until job is complete
            const jobId = result.jobId;
            while (true) {
                const status = await supadata.transcript.getJobStatus(jobId);
                if (status.status === 'completed') {
                    return {
                        content: status.result?.content || "",
                        lang: status.result?.lang || "",
                        availableLangs: status.result?.availableLangs || [],
                    };
                }
                if (status.status === 'failed') {
                    throw new Error('Transcript job failed: ' + status.error);
                }
                // Wait a bit before polling again
                await new Promise((r) => setTimeout(r, 1000));
            }
        }

        // Otherwise, we got the transcript directly
        return {
            content: result.content,
            lang: result.lang,
            availableLangs: result.availableLangs,
        };
    } catch (e: any) {
        if (e instanceof SupadataError) {
            console.error('Supadata error:', e.error, e.details);
            throw new Error(`Supadata error: ${e.error}`);
        }
        throw e;
    }
}
