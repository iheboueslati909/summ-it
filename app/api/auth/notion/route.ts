import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { setStateCookie } from '@/lib/auth';

export async function GET() {
    const clientId = process.env.NOTION_CLIENT_ID;
    const redirectUri = process.env.NOTION_REDIRECT_URI;

    if (!clientId || !redirectUri) {
        return NextResponse.json(
            { error: 'OAuth not configured' },
            { status: 500 }
        );
    }

    // Generate cryptographically secure state for CSRF protection
    const state = randomBytes(32).toString('hex');
    await setStateCookie(state);

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        owner: 'user',
        state,
    });

    const authUrl = `https://api.notion.com/v1/oauth/authorize?${params}`;

    return NextResponse.redirect(authUrl);
}