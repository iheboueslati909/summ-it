import { NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';
import { getSession } from '@/lib/auth/session';
import { NotionClient, splitTextIntoBlocks } from '@/lib/notion/client';
import { SummarizeRequest } from '@/types';
import { summarizeChunk, summarizeTranscript } from '@/lib/ai/summarizer';
import { getYoutubeTranscript } from '@/lib/youtube/supadata';
import { createSummary } from '@/lib/db/models/summary';
import { extractVideoId } from '@/lib/db/models/transcript';

// const llm = new GeminiLLM();

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
            const transcript = await getYoutubeTranscript(youtubeUrl,
                language === 'auto' ? undefined : language
            );
            transcriptText = transcript.content.toString();
            // transcriptText = transcript.map(t => t.text).join(' ');
        } catch (err) {
            return NextResponse.json({
                error: 'No transcript available for this video',
            }, { status: 400 });
        }

        console.log("***************** Fetched transcript is ", transcriptText);
        // ---- 2. Summarize with LLM ----
        const summary = await summarizeTranscript({
            transcript: transcriptText,
            language,
            summaryType: summaryType as any
        });

        // ---- 3. Save to History ----
        try {
            // Simple title extraction: first sentence or first 100 chars
            const title = summary.split(/[.!?]/, 1)[0].substring(0, 150) || "Untitled Summary";
            const videoId = extractVideoId(youtubeUrl) || undefined;

            await createSummary({
                userId: session.userId,
                videoUrl: youtubeUrl,
                videoId,
                title,
                content: summary,
                summaryType,
                language
            });
        } catch (dbErr) {
            console.error('Failed to save summary to history:', dbErr);
            // Don't fail the request if saving history fails, just log it
        }

        // ---- 4. Create or append in Notion ----
        let notionUrl = '';

        if (targetSourceType === 'database') {
            const textBlocks = splitTextIntoBlocks(summary);
            const blocks = textBlocks.map((blockText, index) => ({
                object: 'block' as const,
                type: 'paragraph' as const,
                paragraph: {
                    rich_text: [
                        {
                            type: 'text' as const,
                            text: { content: blockText }
                        }
                    ]
                }
            }));

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
                blocks
            );
            notionUrl = created.url;

        } else if (targetSourceType === 'page') {
            const textBlocks = splitTextIntoBlocks(summary);
            const blocks = [
                {
                    object: 'block' as const,
                    type: 'heading_2' as const,
                    heading_2: {
                        rich_text: [
                            { type: 'text', text: { content: 'YouTube Summary' } }
                        ]
                    }
                },
                ...textBlocks.map(blockText => ({
                    object: 'block' as const,
                    type: 'paragraph' as const,
                    paragraph: {
                        rich_text: [
                            { type: 'text', text: { content: blockText } }
                        ]
                    }
                }))
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
