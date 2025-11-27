import { NotionBlockJson, TextContent } from './json-types';

/**
 * Converts a TextContent object to Notion rich_text format
 */
function convertToRichText(textObj: TextContent | undefined) {
    if (!textObj) return [];

    return [{
        type: 'text' as const,
        text: { content: textObj.content || "" },
        annotations: {
            bold: textObj.bold || false,
            italic: textObj.italic || false,
            strikethrough: false,
            underline: false,
            code: false,
            color: 'default' as const,
        },
    }];
}

/**
 * Recursively converts NotionBlockJson to Notion API block format
 */
function convertBlock(block: NotionBlockJson): any {
    // Helper to handle children
    const getChildren = (b: any) => {
        if (!b.children) return undefined;
        const kids = Array.isArray(b.children) ? b.children : [b.children];
        return kids.map(convertBlock);
    };

    switch (block.type) {
        case 'heading_1':
            return {
                object: 'block',
                type: 'heading_1',
                heading_1: {
                    rich_text: convertToRichText(block.text),
                },
            };

        case 'heading_2':
            return {
                object: 'block',
                type: 'heading_2',
                heading_2: {
                    rich_text: convertToRichText(block.text),
                },
            };

        case 'heading_3':
            return {
                object: 'block',
                type: 'heading_3',
                heading_3: {
                    rich_text: convertToRichText(block.text),
                },
            };

        case 'paragraph':
            const paraBlock: any = {
                object: 'block',
                type: 'paragraph',
                paragraph: {
                    rich_text: convertToRichText(block.text),
                },
            };
            const paraChildren = getChildren(block);
            if (paraChildren && paraChildren.length > 0) {
                paraBlock.paragraph.children = paraChildren;
            }
            return paraBlock;

        case 'bulleted_list_item':
            const bulletBlock: any = {
                object: 'block',
                type: 'bulleted_list_item',
                bulleted_list_item: {
                    rich_text: convertToRichText(block.text),
                },
            };
            const bulletChildren = getChildren(block);
            if (bulletChildren && bulletChildren.length > 0) {
                bulletBlock.bulleted_list_item.children = bulletChildren;
            }
            return bulletBlock;

        case 'numbered_list_item':
            const numberedBlock: any = {
                object: 'block',
                type: 'numbered_list_item',
                numbered_list_item: {
                    rich_text: convertToRichText(block.text),
                },
            };
            const numChildren = getChildren(block);
            if (numChildren && numChildren.length > 0) {
                numberedBlock.numbered_list_item.children = numChildren;
            }
            return numberedBlock;

        case 'table':
            // Notion tables require a specific structure
            if (!block.tableRows || !block.tableRows.cells) {
                return {
                    object: 'block',
                    type: 'paragraph',
                    paragraph: {
                        rich_text: [{ type: 'text', text: { content: '[Invalid Table]' } }],
                    },
                };
            }

            const tableRows = block.tableRows.cells.map(row => ({
                object: 'block' as const,
                type: 'table_row' as const,
                table_row: {
                    cells: row.map(cell => [
                        {
                            type: 'text' as const,
                            text: { content: cell },
                        },
                    ]),
                },
            }));

            return {
                object: 'block',
                type: 'table',
                table: {
                    table_width: block.tableRows.cells[0]?.length || 2,
                    has_column_header: false,
                    has_row_header: false,
                    children: tableRows,
                },
            };

        default:
            // Fallback to paragraph for unknown types
            return {
                object: 'block',
                type: 'paragraph',
                paragraph: {
                    rich_text: [{ type: 'text', text: { content: 'Unknown block type' } }],
                },
            };
    }
}

/**
 * Converts the LLM's JSON output into Notion API block format
 * @param jsonBlocks - Array of NotionBlockJson from LLM output
 * @returns Array of Notion API blocks ready to be sent to Notion
 */
export function convertJsonToNotionBlocks(jsonBlocks: NotionBlockJson[]): any[] {
    if (!Array.isArray(jsonBlocks)) return [];
    return jsonBlocks.map(convertBlock);
}
