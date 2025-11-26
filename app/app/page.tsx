"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LanguageSelector } from "../../components/LanguageSelector";
import { NotionSourceSelector } from "../../components/NotionSourceSelector";
import { YouTubeInput } from "../../components/YoutubeInput";
import { SummaryTypeSelector } from "../../components/SummaryTypeSelector";
import { NotionSource } from "@/types";
import { HistorySidebar } from "@/components/history-sidebar";
import { Summary } from "@/lib/db/models/summary";
import { HistoryCard } from "@/components/history-card";
import { useApi } from "@/hooks/useApi";
import { toast } from "sonner";
import { FileText, BookOpen, Sparkles, ArrowRight, LayoutTemplate, Globe, Database } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

export default function AppPage() {
    const { request } = useApi();

    // Summarizer State
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [language, setLanguage] = useState("auto");
    const [summaryType, setSummaryType] = useState("informative");
    const [outputType, setOutputType] = useState<'notion' | 'pdf'>('notion');
    const [targetSource, setTargetSource] = useState<NotionSource | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // History State
    const [selectedSummary, setSelectedSummary] = useState<Summary | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const isValidUrl = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/.test(
        youtubeUrl
    );
    const canSubmit = isValidUrl && (outputType === 'pdf' || targetSource) && !isSubmitting;

    async function handleSummarize() {
        if (!canSubmit) return;

        setIsSubmitting(true);
        try {
            const data = await request("/api/summarize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    youtubeUrl,
                    language,
                    summaryType,
                    outputType,
                    targetSourceId: targetSource?.id,
                    targetSourceType: targetSource?.type,
                }),
            });

            if (outputType === 'pdf') {
                const link = document.createElement('a');
                link.href = data.pdfData;
                link.download = `${data.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
                link.click();

                toast.success("PDF generated!", {
                    description: "Your summary has been downloaded.",
                });
            } else {
                toast.success("Summary saved!", {
                    description: data.notionUrl ? "Click to open in Notion" : undefined,
                    action: data.notionUrl ? {
                        label: "Open",
                        onClick: () => window.open(data.notionUrl, "_blank"),
                    } : undefined,
                });
                setRefreshTrigger(prev => prev + 1);
            }

            setYoutubeUrl("");
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleHistoryUpdate = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <div className="flex h-[calc(100vh-65px)] overflow-hidden bg-background">
            <HistorySidebar
                selectedId={selectedSummary?._id?.toString() || null}
                onSelect={setSelectedSummary}
                refreshTrigger={refreshTrigger}
            />

            <main className="flex-1 overflow-y-auto">
                <div className="container max-w-3xl py-12 md:py-16 px-4 md:px-8">
                    {selectedSummary ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <Button
                                variant="ghost"
                                className="mb-4 pl-0 hover:pl-2 transition-all"
                                onClick={() => setSelectedSummary(null)}
                            >
                                ← Back to Create
                            </Button>
                            <HistoryCard
                                summary={selectedSummary}
                                onUpdate={handleHistoryUpdate}
                                variant="detail"
                            />
                        </div>
                    ) : (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {/* Minimal Hero */}
                            <div className="text-center space-y-4">
                                <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
                                    Summarize Anything.
                                </h1>
                                <p className="text-muted-foreground text-lg max-w-lg mx-auto">
                                    Turn long videos into concise, actionable notes.
                                </p>
                            </div>

                            {/* Main Input Area */}
                            <div className="space-y-8">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 blur-3xl -z-10 rounded-full opacity-50" />
                                    <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
                                        <CardContent className="p-6 md:p-8 space-y-8">

                                            {/* URL Input - Primary Focus */}
                                            <div className="space-y-3">
                                                <Label className="text-sm font-medium flex items-center gap-2">
                                                    <Database className="w-4 h-4 text-muted-foreground" />
                                                    Youtube URL
                                                </Label>
                                                <YouTubeInput
                                                    value={youtubeUrl}
                                                    onChange={setYoutubeUrl}
                                                />
                                            </div>

                                            {/* Configuration Grid */}
                                            <div className="grid gap-6 md:grid-cols-2">
                                                <div className="space-y-3">
                                                    <Label className="text-sm font-medium flex items-center gap-2">
                                                        <LayoutTemplate className="w-4 h-4 text-muted-foreground" />
                                                        Summary Style
                                                    </Label>
                                                    <SummaryTypeSelector
                                                        value={summaryType}
                                                        onChange={setSummaryType}
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <Label className="text-sm font-medium flex items-center gap-2">
                                                        <Globe className="w-4 h-4 text-muted-foreground" />
                                                        Language
                                                    </Label>
                                                    <LanguageSelector
                                                        value={language}
                                                        onChange={setLanguage}
                                                    />
                                                </div>
                                            </div>

                                            <Separator className="bg-border/50" />

                                            {/* Output Selection */}
                                            <div className="space-y-4">
                                                <Label className="text-sm font-medium flex items-center gap-2">
                                                    <Database className="w-4 h-4 text-muted-foreground" />
                                                    Save Destination
                                                </Label>
                                                <Tabs
                                                    value={outputType}
                                                    onValueChange={(val: any) => setOutputType(val as 'notion' | 'pdf')}
                                                    className="w-full"
                                                >
                                                    <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1">
                                                        <TabsTrigger value="notion" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                                                            <BookOpen className="h-4 w-4" />
                                                            Notion
                                                        </TabsTrigger>
                                                        <TabsTrigger value="pdf" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                                                            <FileText className="h-4 w-4" />
                                                            PDF
                                                        </TabsTrigger>
                                                    </TabsList>
                                                </Tabs>

                                                <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <NotionSourceSelector
                                                        disabled={outputType !== 'notion'}
                                                        value={targetSource}
                                                        onChange={setTargetSource}
                                                    />
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <Button
                                                onClick={handleSummarize}
                                                disabled={!canSubmit}
                                                size="lg"
                                                className="w-full h-12 text-base font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="h-4 w-4 mr-2" />
                                                        Generate Summary
                                                    </>
                                                )}
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}