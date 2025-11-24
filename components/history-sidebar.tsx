"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Plus, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Summary } from "@/lib/db/models/summary";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface HistorySidebarProps {
    selectedId: string | null;
    onSelect: (summary: Summary | null) => void;
    refreshTrigger: number; // Increment to trigger refresh
}

export function HistorySidebar({ selectedId, onSelect, refreshTrigger }: HistorySidebarProps) {
    const [history, setHistory] = useState<Summary[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchHistory();
    }, [refreshTrigger]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/history?limit=100");
            if (res.ok) {
                const data = await res.json();
                setHistory(data.history);
            }
        } catch (error) {
            console.error("Failed to fetch history:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredHistory = history.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full border-r bg-muted/10 w-80 flex-shrink-0">
            <div className="p-4 space-y-4 border-b">
                <Button
                    className="w-full justify-start gap-2"
                    size="lg"
                    variant={selectedId === null ? "default" : "outline"}
                    onClick={() => onSelect(null)}
                >
                    <Plus className="w-4 h-4" />
                    New Summary
                </Button>
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search history..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <ScrollArea className="flex-1">
                {loading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : filteredHistory.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                        No summaries found.
                    </div>
                ) : (
                    <div className="flex flex-col p-2 gap-1">
                        {filteredHistory.map((item) => (
                            <button
                                key={item._id?.toString()}
                                onClick={() => onSelect(item)}
                                className={cn(
                                    "flex flex-col items-start gap-1 p-3 rounded-lg text-left transition-colors hover:bg-accent",
                                    selectedId === item._id?.toString() ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                                )}
                            >
                                <span className="font-medium text-sm line-clamp-1 w-full text-foreground">
                                    {item.title}
                                </span>
                                <div className="flex justify-between w-full items-center text-xs opacity-70">
                                    <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
                                    {item.summaryType && (
                                        <Badge variant="outline" className="text-[10px] px-1 h-4">
                                            {item.summaryType}
                                        </Badge>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
