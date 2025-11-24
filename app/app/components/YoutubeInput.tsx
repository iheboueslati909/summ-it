"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface YouTubeInputProps {
    value: string;
    onChange: (value: string) => void;
    error?: string;
}

export function YouTubeInput({ value, onChange, error }: YouTubeInputProps) {
    const isValid = !value || /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/.test(value);
    const invalid = error || (!isValid && value);

    return (
        <div className="flex flex-col gap-2">
            <Label>
                YouTube Video URL
            </Label>
            <Input
                type="url"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className={cn(
                    "text-base rounded-xl p-3 transition-colors border",
                    invalid && "border-destructive focus-visible:ring-destructive"
                )}
            />
            {invalid && (
                <span className="text-sm text-destructive">
                    {error || "Enter a valid YouTube URL"}
                </span>
            )}
        </div>
    );
}
