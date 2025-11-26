import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { SessionPayload } from './types';

const SESSION_NAME = 'notion_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecretKey() {
    const secret = process.env.SESSION_SECRET;
    if (!secret || secret.length < 32) {
        throw new Error('SESSION_SECRET must be at least 32 characters');
    }
    return new TextEncoder().encode(secret);
}


export async function createSession(payload: SessionPayload): Promise<string> {
    const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(`${SESSION_MAX_AGE}s`)
        .sign(getSecretKey());

    return token;
}

export async function setSessionCookie(payload: SessionPayload) {
    const token = await createSession(payload);
    const cookieStore = await cookies();

    cookieStore.set(SESSION_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_MAX_AGE,
        path: '/',
    });
}

export async function getSession(): Promise<SessionPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_NAME)?.value;

    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, getSecretKey());
        return payload as unknown as SessionPayload;
    } catch {
        return null;
    }
}

export async function clearSession() {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_NAME);
}

// CSRF state cookie helpers
export async function setStateCookie(state: string) {
    const cookieStore = await cookies();
    cookieStore.set('oauth_state', state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 10, // 10 minutes - enough time to complete OAuth
        path: '/',
    });
}

export async function getAndClearStateCookie(): Promise<string | null> {
    const cookieStore = await cookies();
    const state = cookieStore.get('oauth_state')?.value ?? null;
    cookieStore.delete('oauth_state');
    return state;
}
