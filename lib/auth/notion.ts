import { findUserById, updateUserTokens, NotionTokens } from '../db/models/user';

const NOTION_TOKEN_URL = 'https://api.notion.com/v1/oauth/token';
const TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000;

interface NotionTokenResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    bot_id: string;
    workspace_id: string;
    workspace_name?: string;
    owner: {
        type: string;
        user?: {
            id: string;
            person?: { email: string };
        };
    };
    duplicated_template_id?: string;
}

function getBasicAuth(): string {
    const id = process.env.NOTION_CLIENT_ID;
    const secret = process.env.NOTION_CLIENT_SECRET;
    if (!id || !secret) throw new Error('Notion credentials not configured');

    return Buffer.from(`${id}:${secret}`).toString('base64');
}

export async function exchangeCodeForTokens(code: string): Promise<{
    tokens: NotionTokens;
    notionUserId: string;
    email?: string;
}> {
    const res = await fetch(NOTION_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${getBasicAuth()}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            grant_type: 'authorization_code',
            code,
            redirect_uri: process.env.NOTION_REDIRECT_URI,
        }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('Notion token exchange failed:', err);
        throw new Error(`Token exchange failed: ${err.error || res.status}`);
    }

    const data: NotionTokenResponse = await res.json();

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    return {
        tokens: {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt,
            botId: data.bot_id,
            workspaceId: data.workspace_id,
            workspaceName: data.workspace_name,
        },
        notionUserId: data.owner.user?.id ?? data.bot_id,
        email: data.owner.user?.person?.email,
    };
}

export async function refreshNotionToken(userId: string): Promise<NotionTokens> {
    const user = await findUserById(userId);

    if (!user) throw new Error('User not found');
    if (!user.notion) throw new Error('Notion tokens not found');
    if (!user.notion.expiresAt) throw new Error('Token expiry not found');

    // Check if token actually needs refresh
    const now = Date.now();
    const expiresAt = new Date(user.notion.expiresAt).getTime();

    if (expiresAt - now > TOKEN_EXPIRY_BUFFER) {
        return user.notion as NotionTokens;
    }

    // Token expired or about to expire - refresh it
    const res = await fetch(NOTION_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${getBasicAuth()}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            grant_type: 'refresh_token',
            refresh_token: user.notion.refreshToken,
        }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('Token refresh failed:', err);

        // If refresh token is invalid, user needs to re-authenticate
        if (err.error === 'invalid_grant') {
            throw new Error('REAUTH_REQUIRED');
        }
        throw new Error(`Token refresh failed: ${err.error || res.status}`);
    }

    const data: NotionTokenResponse = await res.json();

    const newTokens: NotionTokens = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        botId: user.notion.botId || data.bot_id,
        workspaceId: user.notion.workspaceId || data.workspace_id,
        workspaceName: user.notion.workspaceName || data.workspace_name,
    };

    await updateUserTokens(userId, newTokens);

    return newTokens;
}

// Helper to get valid token (auto-refreshes if needed)
export async function getValidNotionToken(userId: string): Promise<string> {
    const tokens = await refreshNotionToken(userId);
    return tokens.accessToken;
}
