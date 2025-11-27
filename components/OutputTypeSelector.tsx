'use client';

import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, BookOpen, FileText } from "lucide-react";

interface OutputTypeSelectorProps {
    value: 'notion' | 'pdf';
    onChange: (value: 'notion' | 'pdf') => void;
}

export function OutputTypeSelector({ value, onChange }: OutputTypeSelectorProps) {
    return (
        <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium flex items-center gap-2 text-muted-foreground ml-1">
                <Database className="w-4 h-4" />
                Output Format
            </Label>
            <Tabs
                value={value}
                onValueChange={(val: any) => onChange(val as 'notion' | 'pdf')}
                className="w-full"
            >
                <TabsList className="bg-muted/50 p-1 h-10 w-full grid grid-cols-2">
                    <TabsTrigger value="notion" className="text-sm px-3 h-8 gap-1.5">
                        <BookOpen className="h-4 w-4" />
                        Notion
                    </TabsTrigger>
                    <TabsTrigger value="pdf" className="text-sm px-3 h-8 gap-1.5">
                        <FileText className="h-4 w-4" />
                        PDF
                    </TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
    );
}
