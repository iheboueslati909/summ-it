import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { NotionClient, splitTextIntoBlocks, buildNotionBlocks } from '@/lib/notion/client';
import { SummarizeRequest } from '@/types';
import { summarizeTranscript } from '@/lib/ai/summarizer';
import { getTranscriptWithCache } from '@/lib/youtube';
import { createSummary } from '@/lib/db/models/summary';
import { extractVideoId } from '@/lib/db/models/transcript';

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session?.userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await req.json() as SummarizeRequest;
        const { youtubeUrl, language, targetSourceId, targetSourceType, summaryType } = body;

        if (!youtubeUrl || !targetSourceId || !targetSourceType) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const notion = new NotionClient(session.userId);

        // ---- 1. Get transcript ----
        let transcriptText = '';

        try {
            transcriptText = await getTranscriptWithCache(youtubeUrl, language);
        } catch (err) {
            return NextResponse.json({
                error: 'No transcript available for this video',
            }, { status: 400 });
        }

        // ---- 2. Summarize with LLM ----
        const resultSummary = await summarizeTranscript({
            transcript: transcriptText,
            language,
            summaryType: summaryType as any
        });

        if (!resultSummary) return NextResponse.json({ error: 'Summary failed' }, { status: 500 });

        // ---- 3. Save to History ----
        try {
            const videoId = extractVideoId(youtubeUrl) || undefined;

            await createSummary({
                userId: session.userId,
                videoUrl: youtubeUrl,
                videoId,
                title: resultSummary.title,
                content: resultSummary.summary,
                summaryType,
                language
            });
        } catch (dbErr) {
            console.error('Failed to save summary to history:', dbErr);
        }

        // ---- 4. Create or append in Notion ----
        let notionUrl = '';

        if (targetSourceType === 'database') {
            const textBlocks = splitTextIntoBlocks(resultSummary.summary);
            const notionBlocks = buildNotionBlocks(textBlocks);

            const created = await notion.createPageInDatabase(
                targetSourceId,
                {
                    Title: {
                        title: [
                            {
                                type: 'text',
                                text: { content: `Summary: ${youtubeUrl}` }
                            }
                        ]
                    }
                },
                notionBlocks
            );
            notionUrl = created.url;

        } else if (targetSourceType === 'page') {
            const textBlocks = splitTextIntoBlocks(resultSummary.summary);
            const notionBlocks = buildNotionBlocks(textBlocks);

            const blocks = [
                {
                    object: 'block' as const,
                    type: 'heading_2' as const,
                    heading_2: {
                        rich_text: [
                            { type: 'text', text: { content: resultSummary.title } }
                        ]
                    }
                },
                ...notionBlocks
            ];

            await notion.appendBlocks(targetSourceId, blocks);
            notionUrl = `https://www.notion.so/${targetSourceId.replace(/-/g, '')}`;
        }

        return NextResponse.json({ notionUrl }, { status: 200 });

    } catch (err) {
        console.error('SUMMARIZE API ERROR:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
