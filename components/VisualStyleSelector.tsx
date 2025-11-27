'use client';

import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";

interface VisualStyleSelectorProps {
    useIcons: boolean;
    onChange: (value: boolean) => void;
}

export function VisualStyleSelector({ useIcons, onChange }: VisualStyleSelectorProps) {
    return (
        <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium flex items-center gap-2 text-muted-foreground ml-1">
                <Sparkles className="w-4 h-4" />
                Visual Style
            </Label>
            <div className="bg-background/50 backdrop-blur-sm rounded-lg border border-border/50 p-4 h-10 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Use Icons</span>
                <button
                    type="button"
                    role="switch"
                    aria-checked={useIcons}
                    onClick={() => onChange(!useIcons)}
                    className={`
                        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                        ${useIcons ? 'bg-primary' : 'bg-muted'}
                    `}
                >
                    <span
                        className={`
                            inline-block h-4 w-4 transform rounded-full bg-background transition-transform
                            ${useIcons ? 'translate-x-6' : 'translate-x-1'}
                        `}
                    />
                </button>
            </div>
        </div>
    );
}
