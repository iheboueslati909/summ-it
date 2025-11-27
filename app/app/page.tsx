"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "../../components/LanguageSelector";
import { NotionSourceSelector } from "../../components/NotionSourceSelector";
import { YouTubeInput } from "../../components/YoutubeInput";
import { SummaryTypeSelector } from "../../components/SummaryTypeSelector";
import { OutputTypeSelector } from "../../components/OutputTypeSelector";
import { VisualStyleSelector } from "../../components/VisualStyleSelector";
import { NotionSource } from "@/types";
import { HistorySidebar } from "@/components/history-sidebar";
import { Summary } from "@/lib/db/models/summary";
import { HistoryCard } from "@/components/history-card";
import { useApi } from "@/hooks/useApi";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import HeroSection from "@/components/hero-section";

export default function AppPage() {
    const { request } = useApi();

    // Summarizer State
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [language, setLanguage] = useState("auto");
    const [summaryType, setSummaryType] = useState("informative");
    const [outputType, setOutputType] = useState<'notion' | 'pdf'>('notion');
    const [targetSource, setTargetSource] = useState<NotionSource | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [useIcons, setUseIcons] = useState(true);

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
                    useIcons
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
        <div className="relative">
            <div className="flex h-[calc(100vh-65px)] overflow-hidden relative z-10">
                <HistorySidebar
                    selectedId={selectedSummary?._id?.toString() || null}
                    onSelect={setSelectedSummary}
                    refreshTrigger={refreshTrigger}
                />
                <main className="flex-1 overflow-y-auto relative z-10">
                    <div className="container max-w-7xl py-12 md:py-16 px-6 md:px-12 flex flex-col items-center justify-center min-h-[80%]">
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
                                <HeroSection />
                                {/* Main Input Area - Wider */}
                                <div className="w-full max-w-6xl mx-auto space-y-8">
                                    {/* YouTube Input + Generate Button on Same Line */}
                                    <div className="flex gap-3 items-start">
                                        <div className="flex-1 relative group">
                                            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
                                            <div className="relative bg-background/80 backdrop-blur-xl rounded-xl border border-border/50 shadow-lg p-2">
                                                <YouTubeInput
                                                    value={youtubeUrl}
                                                    onChange={setYoutubeUrl}
                                                />
                                            </div>
                                        </div>

                                        <Button
                                            onClick={handleSummarize}
                                            disabled={!canSubmit}
                                            size="lg"
                                            className="w-44 h-[58px] text-base font-medium shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300 rounded-xl shrink-0"
                                        >
                                            {isSubmitting ? (
                                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                            ) : (
                                                <>
                                                    <Sparkles className="h-5 w-5 mr-2" />
                                                    Generate
                                                </>
                                            )}
                                        </Button>
                                    </div>

                                    {/* 3 Column Configuration Grid */}
                                    <div className="grid gap-6 md:grid-cols-3">
                                        {/* Column 1: Summary Style */}
                                        <div className="space-y-3">
                                            <SummaryTypeSelector
                                                value={summaryType}
                                                onChange={setSummaryType}
                                            />
                                        </div>

                                        {/* Column 2: Output Type */}
                                        <div className="space-y-3">
                                            <OutputTypeSelector
                                                value={outputType}
                                                onChange={setOutputType}
                                            />

                                            {/* Notion Destination - Full Width Below */}
                                            <NotionSourceSelector
                                                value={targetSource}
                                                onChange={setTargetSource}
                                                disabled={outputType !== 'notion'}
                                            />
                                        </div>

                                        {/* Column 3: Language & Visual Style */}
                                        <div className="space-y-3">
                                            <LanguageSelector
                                                value={language}
                                                onChange={setLanguage}
                                            />
                                            <VisualStyleSelector
                                                useIcons={useIcons}
                                                onChange={setUseIcons}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}