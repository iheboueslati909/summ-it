"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LanguageSelector } from "./components/LanguageSelector";
import { NotionSourceSelector } from "./components/NotionSourceSelector";
import { YouTubeInput } from "./components/YoutubeInput";
import { NotionSource } from "@/types";

export default function AppPage() {
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [language, setLanguage] = useState("auto");
    const [targetSource, setTargetSource] = useState<NotionSource | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isValidUrl = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/.test(
        youtubeUrl
    );
    const canSubmit = isValidUrl && targetSource && !isSubmitting;

    async function handleSummarize() {
        if (!canSubmit) return;
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/summarize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    youtubeUrl,
                    language,
                    targetSourceId: targetSource!.id,
                    targetSourceType: targetSource!.type,
                }),
            });

            if (!res.ok) throw new Error("Failed to summarize");

            const data = await res.json();
            alert(`Summary saved! ${data.notionUrl || ""}`);
            setYoutubeUrl("");
        } catch (err) {
            alert("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    function openNotionSettings() {
        window.open("https://notion.so/my-integrations", "_blank");
    }

    return (
        <main className="flex justify-center p-6 md:p-10 w-full">
            <Card className="w-full max-w-lg shadow-sm border rounded-2xl">
                <CardHeader>
                    <CardTitle className="text-2xl font-semibold">
                        Summarize YouTube Video
                    </CardTitle>
                    <CardDescription>
                        Extract subtitles, generate a summary, and save it directly to Notion.
                    </CardDescription>
                </CardHeader>

                <CardContent className="flex flex-col gap-6">
                    <YouTubeInput value={youtubeUrl} onChange={setYoutubeUrl} />

                    <LanguageSelector value={language} onChange={setLanguage} />

                    <NotionSourceSelector value={targetSource} onChange={setTargetSource} />

                    <Separator className="my-2" />

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
                </CardContent>
            </Card>
        </main>
    );
}
