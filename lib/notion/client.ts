import { getValidNotionToken } from '../auth/notion';
import {
    NotionPage,
    NotionDatabase,
    CreatePageResponse,
    AppendBlockChildrenResponse,
} from './types';

const NOTION_API_BASE = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

export class NotionClient {
    private userId: string;

    constructor(userId: string) {
        this.userId = userId;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        // Auto-refresh token if needed
        const token = await getValidNotionToken(this.userId);

        const res = await fetch(`${NOTION_API_BASE}${endpoint}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Notion-Version': NOTION_VERSION,
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || `Notion API error: ${res.status}`);
        }

        return res.json();
    }

    // Search for all shared pages and databases
    async search(query?: string) {
        return this.request<NotionSearchResponse>('/search', {
            method: 'POST',
            body: JSON.stringify({
                query: query || '',
                page_size: 100,
                sort: {
                    direction: 'descending',
                    timestamp: 'last_edited_time',
                },
            }),
        });
    }

    // Get specific page
    async getPage(pageId: string) {
        return this.request(`/pages/${pageId}`);
    }

    // Get specific database
    async getDatabase(databaseId: string) {
        return this.request(`/databases/${databaseId}`);
    }

    // Create page in a database
    async createPageInDatabase(
        databaseId: string,
        properties: any,
        children: any[]
    ) {
        return this.request<CreatePageResponse>('/pages', {
            method: 'POST',
            body: JSON.stringify({
                parent: { database_id: databaseId },
                properties,
                children,
            }),
        });
    }

    // Append blocks to a page
    async appendBlocks(pageId: string, children: any[]) {
        return this.request<AppendBlockChildrenResponse>(`/blocks/${pageId}/children`, {
            method: 'PATCH',
            body: JSON.stringify({ children }),
        });
    }
}

// Notion API response types
interface NotionSearchResponse {
    results: NotionSearchResult[];
    has_more: boolean;
    next_cursor: string | null;
}

interface NotionSearchResult {
    id: string;
    object: 'page' | 'database';
    last_edited_time: string;
    icon?: {
        type: 'emoji' | 'external' | 'file';
        emoji?: string;
        external?: { url: string };
        file?: { url: string };
    };
    // Page-specific
    properties?: {
        title?: { title: Array<{ plain_text: string }> };
        Name?: { title: Array<{ plain_text: string }> };
        [key: string]: any;
    };
    // Database-specific
    title?: Array<{ plain_text: string }>;
}

// Helper to extract title from Notion's nested structure
export function extractTitle(result: NotionSearchResult): string {
    if (result.object === 'database') {
        return result.title?.map(t => t.plain_text).join('') || 'Untitled Database';
    }

    // Pages store title in properties
    const props = result.properties || {};
    const titleProp = props.title || props.Name || Object.values(props).find(
        (p: any) => p?.type === 'title'
    );

    if (titleProp?.title) {
        return titleProp.title.map((t: any) => t.plain_text).join('') || 'Untitled';
    }

    return 'Untitled';
}

// Helper to extract icon
export function extractIcon(result: NotionSearchResult): string | undefined {
    if (!result.icon) return undefined;

    if (result.icon.type === 'emoji') return result.icon.emoji;
    if (result.icon.type === 'external') return result.icon.external?.url;
    if (result.icon.type === 'file') return result.icon.file?.url;

    return undefined;
}