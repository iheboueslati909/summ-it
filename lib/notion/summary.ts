import { NotionClient, splitTextIntoBlocks, buildNotionBlocks } from './client';

export interface SaveSummaryToNotionParams {
    notion: NotionClient;
    targetSourceId: string;
    targetSourceType: 'database' | 'page';
    youtubeUrl: string;
    title: string;
    summary: string;
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
    const { notion, targetSourceId, targetSourceType, youtubeUrl, title, summary } = params;

    const textBlocks = splitTextIntoBlocks(summary);
    const notionBlocks = buildNotionBlocks(textBlocks);

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
            notionBlocks
        );
        notionUrl = created.url;
    }

    if (targetSourceType === "page") {
        const blocks = [
            {
                object: "block" as const,
                type: "heading_2" as const,
                heading_2: {
                    rich_text: [
                        { type: "text", text: { content: title } },
                    ],
                },
            },
            ...notionBlocks,
        ];

        await notion.appendBlocks(targetSourceId, blocks);
        notionUrl = `https://www.notion.so/${targetSourceId.replace(/-/g, "")}`;
    }

    return { notionUrl };
}
