import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { updateSummary, deleteSummary } from '@/lib/db/models/summary';

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session?.userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { title } = body;

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        const result = await updateSummary(id, session.userId, { title });

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: 'Summary not found or unauthorized' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating summary:', error);
        return NextResponse.json({ error: 'Failed to update summary' }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session?.userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { id } = await params;
        const result = await deleteSummary(id, session.userId);

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'Summary not found or unauthorized' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting summary:', error);
        return NextResponse.json({ error: 'Failed to delete summary' }, { status: 500 });
    }
}
