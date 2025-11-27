import { NotionClient } from './client';

export interface SaveSummaryToNotionParams {
    notion: NotionClient;
    targetSourceId: string;
    targetSourceType: 'database' | 'page';
    youtubeUrl: string;
    title: string;
    blocks: any[];
}

export interface SaveSummaryToNotionResult {
    notionUrl: string;
}

/**
 * Save a video summary to Notion (either as a new database page or appended to an existing page)
 * @param params - The parameters for saving the summary
 * @returns The Notion URL where the summary was saved
 */
export async function saveSummaryToNotion(
    params: SaveSummaryToNotionParams
): Promise<SaveSummaryToNotionResult> {
    const { notion, targetSourceId, targetSourceType, youtubeUrl, title, blocks } = params;

    let notionUrl = "";

    if (targetSourceType === "database") {
        const created = await notion.createPageInDatabase(
            targetSourceId,
            {
                Title: {
                    title: [
                        {
                            type: "text",
                            text: { content: `Summary: ${youtubeUrl}` },
                        },
                    ],
                },
            },
            blocks
        );
        notionUrl = created.url;
    }

    if (targetSourceType === "page") {
        const pageBlocks = [
            {
                object: "block" as const,
                type: "heading_2" as const,
                heading_2: {
                    rich_text: [
                        { type: "text", text: { content: title } },
                    ],
                },
            },
            ...blocks,
        ];

        await notion.appendBlocks(targetSourceId, pageBlocks);
        notionUrl = `https://www.notion.so/${targetSourceId.replace(/-/g, "")}`;
    }

    return { notionUrl };
}
