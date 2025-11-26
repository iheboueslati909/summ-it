import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { NotionClient, saveSummaryToNotion } from '@/lib/notion';
import { SummarizeRequest } from '@/types';
import { summarizeTranscript } from '@/lib/ai';
import { getTranscriptWithCache } from '@/lib/youtube';
import { createSummary } from '@/lib/db/models/summary';
import { extractVideoId } from '@/lib/db/models/transcript';
import { TranscriptResult } from '@/types';

function err(code: string, message: string, hint?: string, status = 400) {
    return NextResponse.json({ code, message, hint }, { status });
}

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session?.userId) {
            return err(
                "NOT_AUTHENTICATED",
                "You must be logged in to summarize videos.",
                "Log in and try again.",
                401
            );
        }

        const body = await req.json() as SummarizeRequest;
        const { youtubeUrl, language, targetSourceId, targetSourceType, summaryType } = body;

        if (!youtubeUrl || !targetSourceId || !targetSourceType) {
            return err(
                "MISSING_FIELDS",
                "Required fields are missing.",
                "Ensure YouTube URL and Notion destination are provided."
            );
        }

        const notion = new NotionClient(session.userId);
        let transcriptResult: TranscriptResult | null = null
        // ---- 1. Transcript retrieval ----
        try {
            transcriptResult = await getTranscriptWithCache(youtubeUrl, language);
        } catch {
            return err(
                "NO_TRANSCRIPT",
                "This video has no available transcript.",
                "Try another video or check if captions exist."
            );
        }

        // ---- 2. LLM summary ----
        const resultSummary = await summarizeTranscript({
            transcript: transcriptResult?.content?.toString() || "",
            language: transcriptResult?.lang || language,
            summaryType: summaryType as any,
        });

        if (!resultSummary) {
            return err(
                "SUMMARY_FAILED",
                "The assistant couldn't generate a summary.",
                "Try changing the summary type or language.",
                500
            );
        }

        // ---- 3. History save (non-fatal) ----
        try {
            const videoId = extractVideoId(youtubeUrl) || undefined;

            await createSummary({
                userId: session.userId,
                videoUrl: youtubeUrl,
                videoId,
                title: resultSummary.title,
                content: resultSummary.summary,
                summaryType,
                language: transcriptResult?.lang || language,
                availableLanguages: transcriptResult?.availableLangs || [],
            });
        } catch (dbErr) {
            console.error("Failed to save summary:", dbErr);
        }

        // ---- 4. Notion output ----
        const { notionUrl } = await saveSummaryToNotion({
            notion,
            targetSourceId,
            targetSourceType,
            youtubeUrl,
            title: resultSummary.title,
            summary: resultSummary.summary,
        });

        return NextResponse.json({ notionUrl });

    } catch (err: any) {
        console.error("SUMMARIZE API ERROR:", err);
        return err(
            "SERVER_ERROR",
            "Unexpected server error.",
            "Please try again later.",
            500
        );
    }
}
