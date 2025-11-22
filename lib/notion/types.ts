//
// --- PAGE OBJECT ---
//
export interface NotionPage {
    object: 'page';
    id: string;
    created_time: string;
    last_edited_time: string;
    archived: boolean;
    parent: {
        type: 'page_id' | 'database_id' | 'workspace';
        page_id?: string;
        database_id?: string;
    };
    properties: Record<string, any>;
    url: string;
}

//
// --- DATABASE OBJECT ---
//
export interface NotionDatabase {
    object: 'database';
    id: string;
    title: Array<{
        type: 'text';
        plain_text: string;
    }>;
    properties: Record<string, any>;
}

//
// --- CREATE PAGE RESPONSE (same as NotionPage) ---
//
export type CreatePageResponse = NotionPage;

//
// --- APPEND BLOCKS RESPONSE ---
// (Notion returns a block list wrapper)
//
export interface AppendBlockChildrenResponse {
    object: 'list';
    results: NotionBlock[];
    has_more: boolean;
    next_cursor: string | null;
}

//
// --- BASIC BLOCK TYPE ---
// Enough for your use-case (paragraph, heading, etc.)
//
export interface NotionBlock {
    object: 'block';
    id: string;
    type: string;
    has_children: boolean;
    [key: string]: any; // keep it flexible
}
