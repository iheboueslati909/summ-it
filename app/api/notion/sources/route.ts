import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { NotionClient, extractTitle, extractIcon } from '@/lib/notion/client';
import { NotionSource } from '@/types';

export async function GET() {
    const session = await getSession();

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const notion = new NotionClient(session.userId);
        const response = await notion.search();

        // Normalize results
        const sources: NotionSource[] = response.results.map(result => ({
            id: result.id,
            title: extractTitle(result),
            type: result.object as 'page' | 'database',
            icon: extractIcon(result),
            lastEdited: result.last_edited_time,
        }));

        // Sort: databases first, then by last edited
        sources.sort((a, b) => {
            if (a.type !== b.type) return a.type === 'database' ? -1 : 1;
            return new Date(b.lastEdited || 0).getTime() - new Date(a.lastEdited || 0).getTime();
        });

        return NextResponse.json({ sources });

    } catch (err) {
        console.error('Failed to fetch Notion sources:', err);

        const message = err instanceof Error ? err.message : 'Unknown error';

        // Handle re-auth requirement
        if (message === 'REAUTH_REQUIRED') {
            return NextResponse.json(
                { error: 'Please reconnect your Notion account', code: 'REAUTH_REQUIRED' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to load Notion sources' },
            { status: 500 }
        );
    }
}
