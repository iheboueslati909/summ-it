import { Label } from "@/components/ui/label";
import { SUMMARY_TYPES } from "@/lib/ai/prompts";
import { cn } from "@/lib/utils";

interface SummaryTypeSelectorProps {
    value: string;
    onChange: (value: string) => void;
}

export function SummaryTypeSelector({ value, onChange }: SummaryTypeSelectorProps) {
    const selected = SUMMARY_TYPES.find((t) => t.value === value);

    return (
        <div className="flex flex-col gap-3">
            <Label className="text-sm font-medium text-muted-foreground">
                Summary Type
            </Label>

            {/* BUTTON GROUP */}
            <div className="flex flex-wrap gap-2">
                {SUMMARY_TYPES.map((type) => {
                    const isActive = type.value === value;

                    return (
                        <button
                            key={type.value}
                            type="button"
                            onClick={() => onChange(type.value)}
                            className={cn(
                                "px-3 py-1.5 rounded-md text-sm border transition",
                                "hover:bg-accent hover:text-accent-foreground",
                                isActive
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "border-muted-foreground/20"
                            )}
                        >
                            {type.label}
                        </button>
                    );
                })}
            </div>

            {/* DESCRIPTION PANEL */}
            {selected && (
                <span className="text-xs text-muted-foreground">

                    {selected.description}
                </span>
            )}
        </div>
    );
}
