"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
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

export default function AppPage() {
    const { request } = useApi();

    // Summarizer State
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [language, setLanguage] = useState("auto");
    const [summaryType, setSummaryType] = useState("informative");
    const [targetSource, setTargetSource] = useState<NotionSource | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // History State
    const [selectedSummary, setSelectedSummary] = useState<Summary | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const isValidUrl = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/.test(
        youtubeUrl
    );
    const canSubmit = isValidUrl && targetSource && !isSubmitting;

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
                    targetSourceId: targetSource!.id,
                    targetSourceType: targetSource!.type,
                }),
            });

            toast.success("Summary saved!", {
                description: data.notionUrl ? "Click to open in Notion" : undefined,
                action: data.notionUrl ? {
                    label: "Open",
                    onClick: () => window.open(data.notionUrl, "_blank"),
                } : undefined,
            });
            setYoutubeUrl("");
            setRefreshTrigger(prev => prev + 1);
        } catch (err) {
            // Toast already shown by useApi hook
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    }

    function openNotionSettings() {
        window.open("https://notion.so/my-integrations", "_blank");
    }

    const handleHistoryUpdate = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <div className="flex h-[calc(100vh-65px)] overflow-hidden">
            <HistorySidebar
                selectedId={selectedSummary?._id?.toString() || null}
                onSelect={setSelectedSummary}
                refreshTrigger={refreshTrigger}
            />

            <main className="flex-1 overflow-y-auto p-6 md:p-10 bg-background">
                <div className="max-w-4xl mx-auto h-full">
                    {selectedSummary ? (
                        <HistoryCard
                            summary={selectedSummary}
                            onUpdate={handleHistoryUpdate}
                            variant="detail"
                        />
                    ) : (
                        <Card className="w-full shadow-sm border rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-2xl font-semibold">
                                    Summarize YouTube Video
                                </CardTitle>
                                <CardDescription>
                                    Extract subtitles, generate a summary, and save it directly to Notion.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="flex flex-col gap-6">
                                    <YouTubeInput value={youtubeUrl} onChange={setYoutubeUrl} />
                                    <SummaryTypeSelector value={summaryType} onChange={setSummaryType} />
                                </div>

                                <div className="flex flex-col gap-6">
                                    <LanguageSelector value={language} onChange={setLanguage} />
                                    <NotionSourceSelector value={targetSource} onChange={setTargetSource} />
                                    <Separator />
                                    <div className="flex flex-col gap-3">
                                        <Button
                                            onClick={handleSummarize}
                                            disabled={!canSubmit}
                                            className="w-full text-base py-5 rounded-xl"
                                        >
                                            {isSubmitting ? "Processing..." : "✨ Summarize"}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={openNotionSettings}
                                            className="w-full rounded-xl"
                                        >
                                            + Add more pages
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
}