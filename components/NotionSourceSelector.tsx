'use client';

import { useState, useEffect } from 'react';
import { NotionSource } from '@/types';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface NotionSourceSelectorProps {
    value: NotionSource | null;
    onChange: (source: NotionSource | null) => void;
}

export function NotionSourceSelector({ value, onChange }: NotionSourceSelectorProps) {
    const [sources, setSources] = useState<NotionSource[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchSources();
    }, []);

    async function fetchSources() {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/notion/sources');
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to load');
            }

            setSources(data.sources);

            // Auto-select first database if available
            if (data.sources.length > 0 && !value) {
                const firstDb = data.sources.find((s: NotionSource) => s.type === 'database');
                onChange(firstDb || data.sources[0]);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load sources');
        } finally {
            setLoading(false);
        }
    }

    function handleValueChange(newValue: string) {
        const selected = sources.find(s => s.id === newValue);
        onChange(selected || null);
    }

    // Loading state
    if (loading) {
        return (
            <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium text-muted-foreground">Save to Notion</Label>
                <Skeleton className="h-15 w-full" />
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium text-muted-foreground">Save to Notion</Label>
                <div className="flex items-center justify-between p-2.5 text-sm text-destructive bg-destructive/10 rounded-md">
                    <span>{error}</span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchSources}
                        className="h-7 text-xs border-destructive/50 text-destructive hover:bg-destructive/20 hover:text-destructive"
                    >
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    // Empty state
    if (sources.length === 0) {
        return (
            <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium text-muted-foreground">Save to Notion</Label>
                <div className="p-4 bg-muted/50 rounded-md text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                        No pages shared with this integration.
                    </p>
                    <a
                        href="https://notion.so"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline block mb-2"
                    >
                        + Share a page in Notion
                    </a>
                    <Button variant="outline" size="sm" onClick={fetchSources}>
                        Refresh
                    </Button>
                </div>
            </div>
        );
    }

    // Normal state with sources
    return (
        <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium text-muted-foreground">Save to Notion</Label>
            <Select value={value?.id || ''} onValueChange={handleValueChange}>
                <SelectTrigger>
                    <SelectValue placeholder="Select a page or database" />
                </SelectTrigger>
                <SelectContent>
                    {/* Databases first */}
                    {sources.filter(s => s.type === 'database').length > 0 && (
                        <SelectGroup>
                            <SelectLabel>Databases</SelectLabel>
                            {sources.filter(s => s.type === 'database').map(source => (
                                <SelectItem key={source.id} value={source.id}>
                                    <span className="mr-2">{source.icon || '📊'}</span>
                                    {source.title}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    )}

                    {/* Then pages */}
                    {sources.filter(s => s.type === 'page').length > 0 && (
                        <SelectGroup>
                            <SelectLabel>Pages</SelectLabel>
                            {sources.filter(s => s.type === 'page').map(source => (
                                <SelectItem key={source.id} value={source.id}>
                                    <span className="mr-2">{source.icon || '📄'}</span>
                                    {source.title}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    )}
                </SelectContent>
            </Select>

            <span className="text-xs text-muted-foreground">
                {value?.type === 'database'
                    ? 'A new entry will be created in this database'
                    : 'Content will be appended to this page'}
            </span>
        </div>
    );
}

