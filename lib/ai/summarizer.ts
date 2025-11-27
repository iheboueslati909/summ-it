import { GoogleGenerativeAI } from "@google/generative-ai";
import { CHUNK_SUMMARY_PROMPT, GET_SYNTHESIS_PROMPT } from "./prompts";
import { SummaryType } from "./types";
import { NotionBlockJson } from "./json-types";
import { acquireToken } from "../rate-limiter";
import { chunkTextSmart, extractTitle, verifyTranscript } from "../utils";

const USE_MOCK_LLM = process.env.USE_MOCK_LLM === "true";

let model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]> | null = null;

function getModel() {
    if (USE_MOCK_LLM) return null;

    if (!model) {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is not defined");
        }
        const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        model = client.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    }
    return model;
}

export async function summarizeChunk(
    text: string,
    language: string,
    chunkNum = 1,
    totalChunks = 1
): Promise<string | null> {

    if (USE_MOCK_LLM) return `MOCK SUMMARY (chunk ${chunkNum})`;

    const model = getModel();
    if (!model) throw new Error("LLM model not initialized");

    const prompt = CHUNK_SUMMARY_PROMPT(text, language, chunkNum, totalChunks);

    try {
        await acquireToken();
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, topP: 0.9 }
        });

        const output = result?.response?.text?.()?.trim();
        if (!output) throw new Error("Empty response");

        return output;

    } catch (err) {
        console.error(`❌ Chunk ${chunkNum} failed:`, err);
        return null;
    }
}

export async function summarizeTranscript({
    transcript,
    language,
    summaryType = 'informative',
    useIcons = false
}: {
    transcript: string;
    language: string;
    summaryType?: SummaryType;
    useIcons: boolean;
}): Promise<{ blocks: NotionBlockJson[], title: string } | null> {

    verifyTranscript(transcript);

    // --- 1) Chunking ---
    const chunks = chunkTextSmart(transcript);
    if (chunks.length === 0) throw new Error("No valid chunks created");

    // --- 2) Summarize each chunk ---
    const partialSummaries: string[] = [];

    try {
        for (let idx = 0; idx < chunks.length; idx++) {
            const summary = await summarizeChunk(chunks[idx], language, idx + 1, chunks.length);
            partialSummaries.push(summary ?? `Missing summary for chunk ${idx + 1}`);
        }
    } catch {
        throw new Error("Failed to summarize transcript chunks");
    }

    // --- 3) Synthesis step ---
    try {

        if (USE_MOCK_LLM) {
            const mockBlocks: NotionBlockJson[] = [
                {
                    type: 'heading_1',
                    text: { content: `MOCK TITLE - ${summaryType} Summary` }
                },
                {
                    type: 'paragraph',
                    text: { content: `MOCK SYNTHESIS - Combined ${partialSummaries.length} chunk summaries` }
                }
            ];
            return {
                blocks: mockBlocks,
                title: `MOCK TITLE - ${summaryType} Summary`
            };
        }

        const model = getModel();
        if (!model) throw new Error("LLM model not initialized");

        await acquireToken();
        console.log("******************** USE ICONS ,", useIcons)
        console.log("************** the prompt is ", GET_SYNTHESIS_PROMPT({ summaries: partialSummaries, language, summaryType, useIcons }))
        const synthesis = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [{ text: GET_SYNTHESIS_PROMPT({ summaries: partialSummaries, language, summaryType, useIcons }) }],
                },
            ],
            generationConfig: { temperature: 0.4, topP: 0.95 }
        });

        const final = synthesis?.response?.text?.()?.trim();
        if (!final) throw new Error("Empty synthesis output");

        // Parse JSON response
        let blocks: NotionBlockJson[];
        try {
            // Remove markdown code fences if present
            const jsonText = final.replace(/^```json\n?/i, '').replace(/\n?```$/i, '').trim();
            blocks = JSON.parse(jsonText);

            // Validate it's an array
            if (!Array.isArray(blocks)) {
                throw new Error("Expected JSON array");
            }
        } catch (parseError) {
            console.error("❌ Failed to parse JSON response:", parseError);
            console.error("Raw response:", final);
            throw new Error("Invalid JSON response from LLM");
        }

        // Extract title from first heading block or use fallback
        let title = "Summary";
        const firstHeading = blocks.find(block =>
            block.type === 'heading_1' ||
            block.type === 'heading_2' ||
            block.type === 'heading_3'
        );

        if (firstHeading && 'text' in firstHeading) {
            title = firstHeading.text.content;
        }

        return { blocks, title };

    } catch (err) {
        console.error("❌ Synthesis failed", err);
        return null;
    }
}
