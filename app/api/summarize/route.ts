import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { NotionClient, saveSummaryToNotion } from '@/lib/notion';
import { SummarizeRequest } from '@/types';
import { summarizeTranscript, convertJsonToNotionBlocks } from '@/lib/ai';
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
            return err("NOT_AUTHENTICATED", "You must be logged in to summarize videos.", "Log in and try again.", 401);
        }

        const body = await req.json() as SummarizeRequest;
        const { youtubeUrl, language, targetSourceId, targetSourceType, summaryType, outputType, useIcons } = body;

        if (!youtubeUrl || !outputType) {
            return err("MISSING_FIELDS", "Required fields are missing.", "Ensure YouTube URL and output type are provided.");
        }

        // Validate Notion-specific fields
        if (outputType === 'notion' && (!targetSourceId || !targetSourceType)) {
            return err("MISSING_NOTION_FIELDS", "Notion destination is required.", "Please select a Notion page or database.");
        }

        // 1. Get Transcript
        let transcriptResult: TranscriptResult | null = null;
        try {
            transcriptResult = await getTranscriptWithCache(youtubeUrl, language);
        } catch {
            return err("NO_TRANSCRIPT", "This video has no available transcript.", "Try another video or check if captions exist.");
        }

        // 2. Generate Summary
        const resultSummary = await summarizeTranscript({
            transcript: transcriptResult?.content?.toString() || "",
            language: transcriptResult?.lang || language,
            summaryType: summaryType as any,
            useIcons: useIcons || false,
        });

        if (!resultSummary) {
            return err("SUMMARY_FAILED", "The assistant couldn't generate a summary.", "Try changing the summary type or language.", 500);
        }

        // 3. Handle Output
        if (outputType === 'pdf') {
            const { generateSummaryPDF } = await import('@/lib/utils/pdf-generator');

            // Extract text for PDF
            const summaryText = resultSummary.blocks.map(block =>
                'text' in block ? block.text.content : ''
            ).join('\n\n');

            const pdfData = generateSummaryPDF({
                title: resultSummary.title,
                videoUrl: youtubeUrl,
                summary: summaryText,
                summaryType,
                language: transcriptResult?.lang || language,
            });

            return NextResponse.json({
                pdfData,
                title: resultSummary.title,
                videoUrl: youtubeUrl,
            });
        }

        // Notion Output
        const notion = new NotionClient(session.userId);
        const notionBlocks = convertJsonToNotionBlocks(resultSummary.blocks);

        // 3a. Save to History (Non-blocking)
        createSummary({
            userId: session.userId,
            videoUrl: youtubeUrl,
            videoId: extractVideoId(youtubeUrl) || undefined,
            title: resultSummary.title,
            content: JSON.stringify(resultSummary.blocks), // Store as stringified JSON
            summaryType,
            language: transcriptResult?.lang || language,
            availableLanguages: transcriptResult?.availableLangs || [],
        }).catch(e => console.error("Failed to save summary history:", e));

        // 3b. Save to Notion
        const { notionUrl } = await saveSummaryToNotion({
            notion,
            targetSourceId: targetSourceId!,
            targetSourceType: targetSourceType!,
            youtubeUrl,
            title: resultSummary.title,
            blocks: notionBlocks,
        });

        return NextResponse.json({ notionUrl });

    } catch (error: any) {
        console.error("SUMMARIZE API ERROR:", error);
        return err("SERVER_ERROR", "Unexpected server error.", "Please try again later.", 500);
    }
}
