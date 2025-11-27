/**
 * Type definitions for the JSON structure that the LLM outputs
 * Updated to match the actual output format observed
 */

export interface TextContent {
    content: string;
    bold?: boolean;
    italic?: boolean;
}

export interface HeadingBlock {
    type: 'heading_1' | 'heading_2' | 'heading_3';
    text: TextContent;
}

export interface ParagraphBlock {
    type: 'paragraph';
    text: TextContent;
    children?: NotionBlockJson | NotionBlockJson[];
}

export interface BulletedListItemBlock {
    type: 'bulleted_list_item';
    text: TextContent;
    children?: NotionBlockJson | NotionBlockJson[];
}

export interface NumberedListItemBlock {
    type: 'numbered_list_item';
    text: TextContent;
    children?: NotionBlockJson | NotionBlockJson[];
}

export interface TableBlock {
    type: 'table';
    tableRows: {
        cells: string[][];
    };
}

/**
 * Union type representing all possible Notion block types from LLM output
 */
export type NotionBlockJson =
    | HeadingBlock
    | ParagraphBlock
    | BulletedListItemBlock
    | NumberedListItemBlock
    | TableBlock;
