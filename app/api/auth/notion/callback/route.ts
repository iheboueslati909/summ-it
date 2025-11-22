import { NextRequest, NextResponse } from 'next/server';
import { getAndClearStateCookie, setSessionCookie } from '@/lib/auth/session';
import { exchangeCodeForTokens } from '@/lib/auth/notion';
import { upsertUser } from '@/lib/db/models/user';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Handle OAuth errors (user denied, etc.)
    if (error) {
        console.error('OAuth error:', error);
        return NextResponse.redirect(`${appUrl}?error=${error}`);
    }

    // Validate required params
    if (!code || !state) {
        return NextResponse.redirect(`${appUrl}?error=invalid_request`);
    }

    // CSRF validation - compare state from cookie with state from URL
    const storedState = await getAndClearStateCookie();
    if (!storedState || storedState !== state) {
        console.error('State mismatch - possible CSRF attack');
        return NextResponse.redirect(`${appUrl}?error=invalid_state`);
    }

    try {
        // Exchange code for tokens
        const { tokens, notionUserId, email } = await exchangeCodeForTokens(code);

        // Upsert user in database
        const user = await upsertUser({
            notionUserId,
            email,
            notion: tokens,
        });

        if (!user) {
            throw new Error('Failed to create user');
        }

        // Create session cookie
        await setSessionCookie({
            userId: user._id!.toString(),
            notionUserId,
        });

        // Redirect to app
        return NextResponse.redirect(`${appUrl}/app`);

    } catch (err) {
        console.error('OAuth callback error:', err);
        return NextResponse.redirect(`${appUrl}?error=auth_failed`);
    }
}