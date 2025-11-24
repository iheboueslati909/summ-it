import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getUserHistory } from '@/lib/db/models/summary';

export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session?.userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const skip = parseInt(searchParams.get('skip') || '0');

        const history = await getUserHistory(session.userId, limit, skip);

        return NextResponse.json({ history });
    } catch (error) {
        console.error('Error fetching history:', error);
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
}
