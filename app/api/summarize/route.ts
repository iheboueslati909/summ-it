// app/api/summarize/route.ts
import { NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';
import { getSession } from '@/lib/auth/session';
import { NotionClient } from '@/lib/notion/client';
import { SummarizeRequest } from '@/types';
import { summarizeTranscript } from '@/lib/ai/summarizer';
import { MockLLM } from '@/lib/ai/llm-mock';

const llm = new MockLLM();

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session?.userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await req.json() as SummarizeRequest;
        const { youtubeUrl, language, targetSourceId, targetSourceType } = body;

        if (!youtubeUrl || !targetSourceId || !targetSourceType) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const notion = new NotionClient(session.userId);

        // ---- 1. Get transcript ----
        let transcriptText = '';
        try {
            const transcript = await YoutubeTranscript.fetchTranscript(youtubeUrl, {
                lang: language === 'auto' ? undefined : language,
            });
            transcriptText = transcript.map(t => t.text).join(' ');
        } catch (err) {
            return NextResponse.json({
                error: 'No transcript available for this video',
            }, { status: 400 });
        }

        // ---- 2. Summarize with LLM ----
        const summary = await llm.summarizeTranscript(transcriptText, language);

        // ---- 3. Create or append in Notion ----
        let notionUrl = '';

        if (targetSourceType === 'database') {
            // create new page inside database
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
                [
                    {
                        object: 'block',
                        type: 'paragraph',
                        paragraph: {
                            rich_text: [
                                { type: 'text', text: { content: summary } }
                            ]
                        }
                    }
                ]
            );

            notionUrl = created.url;

        } else if (targetSourceType === 'page') {
            // append blocks to an existing page
            await notion.appendBlocks(targetSourceId, [
                {
                    object: 'block',
                    type: 'heading_2',
                    heading_2: {
                        rich_text: [
                            { type: 'text', text: { content: 'YouTube Summary' } }
                        ]
                    }
                },
                {
                    object: 'block',
                    type: 'paragraph',
                    paragraph: {
                        rich_text: [
                            { type: 'text', text: { content: summary } }
                        ]
                    }
                }
            ]);

            // Page URLs in Notion = frontend URL
            notionUrl = `https://www.notion.so/${targetSourceId.replace(/-/g, '')}`;
        }

        return NextResponse.json({ notionUrl }, { status: 200 });

    } catch (err) {
        console.error('SUMMARIZE API ERROR:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
