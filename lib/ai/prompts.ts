import { SummaryType } from "@/lib/ai/types";

export interface synthesisPromptSettings {
    summaryType: SummaryType;
    useIcons: boolean;
    summaries: string[];
    language: string;
}

export const SUMMARY_TYPES: { value: SummaryType; label: string; description: string }[] = [
    { value: 'informative', label: 'Informative', description: 'Objective report on main points' },
    { value: 'descriptive', label: 'Descriptive', description: 'Objective report describing content' },
    { value: 'executive', label: 'Executive', description: 'Brief overview for business professionals' },
    { value: 'narrative', label: 'Narrative', description: 'Retelling the plot in condensed form' },
    { value: 'critical', label: 'Critical', description: 'Analysis and evaluation of source material' },
    { value: 'evaluative', label: 'Evaluative', description: 'Judgment of quality or effectiveness' },
];
export const CHUNK_SUMMARY_PROMPT = (text: string, language: string, chunkNum: number, totalChunks: number) => `
You are an expert content analyst. Summarize this section of a transcript.

CRITICAL INSTRUCTIONS:
1. Extract the main points, key arguments, and takeaways
2. Preserve specific details: names, dates, statistics, technical terms
3. Maintain narrative flow - this is chunk ${chunkNum}/${totalChunks}
4. Use bullet points for clarity but keep it readable
5. Output in ${language}
6. Max 4 paragraphs or equivalent bullets

TRANSCRIPT SECTION:
${text}

SUMMARY:`;

const PROMPT_TEMPLATES: Record<SummaryType, string> = {
    informative: `
CRITICAL INSTRUCTIONS:
1. Provide an objective report on the main points and content.
2. Focus on facts and information presented.
3. Remove redundancy but keep all key details.
`,
    descriptive: `
CRITICAL INSTRUCTIONS:
1. Provide an objective report describing the content of the text.
2. Focus on *what* the text is about rather than just the facts.
3. Describe the structure and main topics covered.
`,
    executive: `
CRITICAL INSTRUCTIONS:
1. Provide a brief overview intended for business professionals.
2. Highlight key findings, insights, and actionable recommendations.
3. Keep it concise and high-level.
`,
    narrative: `
CRITICAL INSTRUCTIONS:
1. Summarize by retelling the story or flow in a condensed form.
2. Focus on the plot, sequence of events, or narrative arc.
3. Maintain the chronological order of the original content.
`,
    critical: `
CRITICAL INSTRUCTIONS:
1. Provide an analysis and evaluation of the source material.
2. Summarize the content but also critique the arguments, evidence, and validity.
3. Identify strengths and weaknesses in the presentation.
`,
    evaluative: `
CRITICAL INSTRUCTIONS:
1. Provide a personal judgment of the text's quality or effectiveness.
2. Evaluate how well the content achieves its purpose.
3. Include your assessment of the value and impact of the information.
`
};

export const GET_SYNTHESIS_PROMPT = (
    synthesisPromptSettings: synthesisPromptSettings
) => {
    const iconInstruction = synthesisPromptSettings.useIcons
        ? "- Use relevant emojis/icons sparingly to enhance headers and bullet points"
        : "- Do NOT use any emojis, icons, or symbols";

    return `
Create a ${synthesisPromptSettings.summaryType} summary in ${synthesisPromptSettings.language}.

${PROMPT_TEMPLATES[synthesisPromptSettings.summaryType]}

OUTPUT FORMAT:
- Respond in JSON only.
- Each JSON object represents a Notion block.
- Block types: heading_1, heading_2, heading_3, paragraph, bulleted_list_item, numbered_list_item, table.
- For text formatting, use "bold": true/false, "italic": true/false.
- Use "children" for nested blocks (e.g., bullets under paragraphs).
- Use "tableRows" with "cells" array for tables.

CONTENT REQUIREMENTS:
- Merge redundant information across sections
- Preserve specific details: names, dates, numbers, technical terms
- Use emojis/icons if allowed by settings: ${iconInstruction}

SOURCE SECTIONS:
${synthesisPromptSettings.summaries
            .map((s, i) => `Section ${i + 1}: ${s}`)
            .join("\n\n")}

Write the summary below in JSON following the above rules:
`;
};
