import { useState, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { Pencil, Trash2, ExternalLink, FileText, Calendar, Video } from "lucide-react";
import { Summary } from "@/lib/db/models/summary";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { NotionBlockRenderer } from "./notion-block-renderer";
import { NotionBlockJson } from "@/lib/ai/json-types";

interface PreviewContentProps {
    summary: Summary;
    onUpdate: () => void;
    variant?: 'card' | 'detail';
}

export function PreviewContent({ summary, onUpdate, variant = 'card' }: PreviewContentProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(summary.title);
    const [isLoading, setIsLoading] = useState(false);

    // Parse blocks or fallback to text
    const { blocks, plainText } = useMemo(() => {
        try {
            const parsed = JSON.parse(summary.content);
            if (Array.isArray(parsed)) {
                return { blocks: parsed as NotionBlockJson[], plainText: null };
            }
            return { blocks: null, plainText: summary.content };
        } catch {
            return { blocks: null, plainText: summary.content };
        }
    }, [summary.content]);

    const handleUpdateTitle = async () => {
        if (title === summary.title) {
            setIsEditing(false);
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`/api/history/${summary._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title }),
            });

            if (!res.ok) throw new Error("Failed to update title");

            toast.success("Title updated");
            setIsEditing(false);
            onUpdate();
        } catch (error) {
            toast.error("Failed to update title");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this summary?")) return;

        setIsLoading(true);
        try {
            const res = await fetch(`/api/history/${summary._id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete summary");

            toast.success("Summary deleted");
            onUpdate();
        } catch (error) {
            toast.error("Failed to delete summary");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className={cn(
            "flex flex-col transition-shadow",
            variant === 'card' && "hover:shadow-md"
        )}>
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                    {isEditing ? (
                        <div className="flex w-full gap-2">
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="h-8"
                                autoFocus
                            />
                            <Button size="sm" onClick={handleUpdateTitle} disabled={isLoading}>
                                Save
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                                Cancel
                            </Button>
                        </div>
                    ) : (
                        <CardTitle className={cn(
                            "font-medium leading-tight",
                            variant === 'card' ? "text-lg line-clamp-2" : "text-2xl"
                        )} title={summary.title}>
                            {summary.title}
                        </CardTitle>
                    )}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs font-normal">
                        {summary.summaryType || "General"}
                    </Badge>
                    {summary.language && (
                        <Badge variant="outline" className="text-xs font-normal uppercase">
                            {summary.language}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="flex-1 pb-3">
                <div className="flex flex-col gap-1 text-xs text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDistanceToNow(new Date(summary.createdAt), { addSuffix: true })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Video className="w-3 h-3" />
                        <a
                            href={summary.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline truncate max-w-[200px]"
                        >
                            Watch Video
                        </a>
                    </div>
                </div>

                <div className={cn(
                    "text-sm text-foreground",
                    variant === 'card' && "line-clamp-3 max-h-[100px] overflow-hidden mask-linear-fade"
                )}>
                    {blocks ? (
                        <NotionBlockRenderer blocks={blocks} />
                    ) : (
                        <div className="whitespace-pre-wrap">{plainText}</div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="pt-0 flex justify-between border-t p-4 bg-muted/20">
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsEditing(true)}>
                        <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={handleDelete}>
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>

                {variant === 'card' && (
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                                <FileText className="w-4 h-4" />
                                View Full
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{summary.title}</DialogTitle>
                                <div className="text-sm text-muted-foreground pt-1 flex gap-4">
                                    <span>{new Date(summary.createdAt).toLocaleDateString()}</span>
                                    <a href={summary.videoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:underline text-primary">
                                        Open Video <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            </DialogHeader>
                            <div className="mt-4">
                                {blocks ? (
                                    <NotionBlockRenderer blocks={blocks} />
                                ) : (
                                    <div className="whitespace-pre-wrap">{plainText}</div>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </CardFooter>
        </Card>
    );
}
