import { SummaryType } from "@/lib/ai/types";

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
    summaries: string[],
    language: string,
    type: SummaryType = 'informative'
) => `
Create a ${type} summary in ${language} using markdown format.

${PROMPT_TEMPLATES[type]}

STRUCTURE YOUR OUTPUT:
- Use ## for main section headers
- Use **bold** for key terms, names, and statistics  
- Use - for bullet points when listing multiple items
- Write 4-12 paragraphs organized into logical sections

CONTENT REQUIREMENTS:
- Write directly as the final document (not "this summary discusses...")
- Merge redundant information across sections
- Preserve specific details: names, dates, numbers, technical terms
- Use tables if convenient

SOURCE SECTIONS:
${summaries.map((s, i) => `## Section ${i + 1}\n${s}`).join("\n\n")}

Write the formatted summary below:

`;