"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { FileText, BookOpen, Sparkles, LayoutTemplate, Globe, Database } from "lucide-react";
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
        <div className="flex h-[calc(100vh-65px)] overflow-hidden bg-background relative">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-6xl pointer-events-none z-0">
                <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-[100px] opacity-50 mix-blend-multiply animate-blob" />
                <div className="absolute top-40 right-20 w-72 h-72 bg-secondary/10 rounded-full blur-[100px] opacity-50 mix-blend-multiply animate-blob animation-delay-2000" />
                <div className="absolute -bottom-20 left-1/2 w-72 h-72 bg-accent/10 rounded-full blur-[100px] opacity-50 mix-blend-multiply animate-blob animation-delay-4000" />
            </div>

            <HistorySidebar
                selectedId={selectedSummary?._id?.toString() || null}
                onSelect={setSelectedSummary}
                refreshTrigger={refreshTrigger}
            />

            <main className="flex-1 overflow-y-auto relative z-10">
                <div className="container py-12 md:py-20 px-4 md:px-8 flex flex-col items-center justify-center min-h-[80%]">
                    {selectedSummary ? (
                        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <Button
                                variant="ghost"
                                className="mb-6 pl-0 hover:pl-2 transition-all"
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
                        <div className="w-full space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {/* Hero Section */}
                            <div className="text-center space-y-6 max-w-2xl mx-auto">
                                <Badge variant="secondary" className="px-4 py-1.5 text-sm rounded-full bg-secondary/50 backdrop-blur-sm border-secondary-foreground/10 text-secondary-foreground">
                                    <Sparkles className="w-3.5 h-3.5 mr-2 inline-block" />
                                    AI-Powered Summarizer
                                </Badge>
                                <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground leading-tight">
                                    Summarize Anything <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                                        in Seconds.
                                    </span>
                                </h1>
                                <p className="text-muted-foreground text-lg md:text-xl max-w-lg mx-auto leading-relaxed">
                                    Turn long videos into concise, actionable notes. Save time and boost productivity with our advanced AI.
                                </p>
                            </div>

                            {/* Main Input Area */}
                            <div className="w-full max-w-2xl mx-auto space-y-8">
                                {/* URL Input */}
                                <div className="space-y-4">
                                    <div className="relative group">
                                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
                                        <div className="relative bg-background/80 backdrop-blur-xl rounded-xl border border-border/50 shadow-lg p-2">
                                            <YouTubeInput
                                                value={youtubeUrl}
                                                onChange={setYoutubeUrl}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Configuration Grid */}
                                <div className="grid gap-8 md:grid-cols-2">
                                    <div className="space-y-4">
                                        <Label className="text-sm font-medium flex items-center gap-2 text-muted-foreground ml-1">
                                            <LayoutTemplate className="w-4 h-4" />
                                            Summary Style
                                        </Label>
                                        <div className="bg-background/50 backdrop-blur-sm rounded-lg border border-border/50 p-1">
                                            <SummaryTypeSelector
                                                value={summaryType}
                                                onChange={setSummaryType}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <Label className="text-sm font-medium flex items-center gap-2 text-muted-foreground ml-1">
                                            <Globe className="w-4 h-4" />
                                            Language
                                        </Label>
                                        <div className="bg-background/50 backdrop-blur-sm rounded-lg border border-border/50 p-1">
                                            <LanguageSelector
                                                value={language}
                                                onChange={setLanguage}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Output Selection */}
                                <div className="space-y-6 pt-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-medium flex items-center gap-2 text-muted-foreground ml-1">
                                            <Database className="w-4 h-4" />
                                            Save Destination
                                        </Label>
                                        <Tabs
                                            value={outputType}
                                            onValueChange={(val: any) => setOutputType(val as 'notion' | 'pdf')}
                                            className="w-auto"
                                        >
                                            <TabsList className="bg-muted/50 p-1 h-9">
                                                <TabsTrigger value="notion" className="text-xs px-3 h-7 gap-1.5">
                                                    <BookOpen className="h-3.5 w-3.5" />
                                                    Notion
                                                </TabsTrigger>
                                                <TabsTrigger value="pdf" className="text-xs px-3 h-7 gap-1.5">
                                                    <FileText className="h-3.5 w-3.5" />
                                                    PDF
                                                </TabsTrigger>
                                            </TabsList>
                                        </Tabs>
                                    </div>

                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
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
                                    className="w-full h-14 text-lg font-medium shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300 rounded-xl"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="h-5 w-5 mr-2" />
                                            Generate Summary
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}