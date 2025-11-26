import { extractVideoId, findCachedTranscript } from '@/lib/db/models/transcript';
import { getYoutubeTranscript } from './supadata';
import { TranscriptResult } from '@/types';

/**
 * Get transcript for a YouTube video, checking cache first
 * @param youtubeUrl - The YouTube video URL
 * @param language - Optional language code for the transcript
 * @returns The transcript text as a string
 */
export async function getTranscriptWithCache(
    youtubeUrl: string,
    language?: string
): Promise<TranscriptResult | null> {

    const videoId = extractVideoId(youtubeUrl);

    // 1. Check cache
    if (videoId) {
        try {
            const cached = await findCachedTranscript(videoId);
            if (cached) {
                const cachedIsText = typeof cached.transcript.content === 'string';
                const requestIsText = true;

                // Only return cached if the content format matches (text vs chunks)
                // And if a specific language was requested, it matches the cached one
                const langMatch = language === 'auto' ? true : (!language || cached.transcript.lang === language);
                const formatMatch = cachedIsText === requestIsText;

                if (langMatch && formatMatch) {
                    console.log(`[Cache Hit] Serving transcript for video ${videoId}`);
                    return {
                        content: cached.transcript.content,
                        lang: cached.transcript.lang,
                        availableLangs: cached.transcript.availableLangs
                    }
                }
            }
        } catch (error) {
            console.error('Error checking transcript cache:', error);
            // Continue to fetch if cache check fails
        }
    }

    // 2. Fetch from API if not cached
    let transcriptResult = null;
    try {
        const transcript = await getYoutubeTranscript(
            youtubeUrl,
            language === 'auto' ? undefined : language
        );
        return {
            content: transcript.content,
            lang: transcript.lang,
            availableLangs: transcript.availableLangs
        }
    } catch (err) {
        throw new Error('No transcript available for this video');
    }

}
