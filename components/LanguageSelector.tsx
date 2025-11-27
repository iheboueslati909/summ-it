'use client';

import { SUPPORTED_LANGUAGES } from '@/types';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Globe } from "lucide-react";

interface LanguageSelectorProps {
    value: string;
    onChange: (value: string) => void;
}

export function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
    return (
        <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium flex items-center gap-2 text-muted-foreground ml-1">
                <Globe className="w-4 h-4" />
                Language
            </Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                    {SUPPORTED_LANGUAGES.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                            {lang.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}