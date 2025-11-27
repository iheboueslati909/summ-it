import React from 'react';
import { NotionBlockJson, TextContent } from '@/lib/ai/json-types';
import { cn } from '@/lib/utils';

interface NotionBlockRendererProps {
    blocks: NotionBlockJson[];
    className?: string;
}

const TextRenderer = ({ text }: { text: TextContent }) => {
    if (!text) return null;

    return (
        <span className={cn(
            text.bold && "font-bold",
            text.italic && "italic"
        )}>
            {text.content}
        </span>
    );
};

const BlockRenderer = ({ block }: { block: NotionBlockJson }) => {
    const renderChildren = (children?: NotionBlockJson | NotionBlockJson[]) => {
        if (!children) return null;
        const kids = Array.isArray(children) ? children : [children];
        return (
            <div className="ml-6 mt-1">
                {kids.map((child, i) => (
                    <BlockRenderer key={i} block={child} />
                ))}
            </div>
        );
    };

    switch (block.type) {
        case 'heading_1':
            return (
                <h1 className="scroll-m-20 text-3xl font-bold tracking-tight mt-8 mb-4 first:mt-0">
                    <TextRenderer text={block.text} />
                </h1>
            );
        case 'heading_2':
            return (
                <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-8 mb-3">
                    <TextRenderer text={block.text} />
                </h2>
            );
        case 'heading_3':
            return (
                <h3 className="scroll-m-20 text-xl font-semibold tracking-tight mt-6 mb-2">
                    <TextRenderer text={block.text} />
                </h3>
            );
        case 'paragraph':
            return (
                <div className="leading-7 [&:not(:first-child)]:mt-4 mb-2">
                    <p><TextRenderer text={block.text} /></p>
                    {renderChildren(block.children)}
                </div>
            );
        case 'bulleted_list_item':
            return (
                <div className="my-1">
                    <div className="flex items-start gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-90" />
                        <div className="flex-1">
                            <TextRenderer text={block.text} />
                        </div>
                    </div>
                    {renderChildren(block.children)}
                </div>
            );
        case 'numbered_list_item':
            return (
                <div className="my-1 group">
                    <div className="flex items-start gap-2">
                        <span className="min-w-[1.5rem] text-muted-foreground select-none font-medium">
                            •
                        </span>
                        <div className="flex-1">
                            <TextRenderer text={block.text} />
                        </div>
                    </div>
                    {renderChildren(block.children)}
                </div>
            );
        case 'table':
            if (!block.tableRows?.cells) return null;
            return (
                <div className="my-6 w-full overflow-y-auto">
                    <table className="w-full border-collapse text-sm">
                        <tbody>
                            {block.tableRows.cells.map((row, i) => (
                                <tr key={i} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    {row.map((cell, j) => (
                                        <td key={j} className="p-4 align-middle [&:has([role=checkbox])]:pr-0 border">
                                            {cell}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        default:
            return null;
    }
};

export function NotionBlockRenderer({ blocks, className }: NotionBlockRendererProps) {
    if (!blocks || !Array.isArray(blocks)) return null;

    return (
        <div className={cn("text-foreground space-y-1", className)}>
            {blocks.map((block, index) => (
                <BlockRenderer key={index} block={block} />
            ))}
        </div>
    );
}
