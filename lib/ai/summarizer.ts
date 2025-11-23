// lib/ai/summarizer.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

// -----------------------------
// CONFIG
// -----------------------------
const USE_MOCK_LLM = process.env.USE_MOCK_LLM === "true";

const MAX_CHARS_PER_CHUNK = 6000; // Safe for Flash Lite
const MAX_TRANSCRIPT_CHARS = 80000; // Too large → warn or fail

let model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]> | null = null;

if (!USE_MOCK_LLM) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not defined");
    }

    const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = client.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
}

// -----------------------------
// HELPERS
// -----------------------------
function chunkText(text: string, maxSize = MAX_CHARS_PER_CHUNK): string[] {
    const chunks: string[] = [];
    let current = "";

    // Split by sentences to avoid breaking mid-phrase
    for (const part of text.split(".")) {
        const piece = part.trim() + ".";

        if ((current + piece).length > maxSize) {
            chunks.push(current.trim());
            current = piece;
        } else {
            current += piece;
        }
    }

    if (current.trim().length > 0) {
        chunks.push(current.trim());
    }

    return chunks;
}

// -----------------------------
// LLM CALL (Single Chunk)
// -----------------------------
export async function summarizeChunk(text: string, language: string): Promise<string> {
    if (USE_MOCK_LLM) {
        return `MOCK CHUNK SUMMARY (${language}): ${text.substring(0, 120)}...`;
    }

    const prompt = `
You are a professional summarizer.
Summarize the following transcript section clearly in ${language}.
Keep it concise. Do not output more than 5 paragraphs.
Do NOT hallucinate missing content.

Transcript section:
${text}
`;

    const result = await model!.generateContent(prompt);
    const summary = result.response.text().trim();

    if (!summary) {
        throw new Error("Gemini returned an empty summary chunk");
    }

    return summary;
}

// -----------------------------
// MAIN PIPELINE
// -----------------------------
export async function summarizeTranscript({
    transcript,
    language,
}: {
    transcript: string;
    language: string;
}): Promise<string> {
    if (!transcript) {
        throw new Error("Transcript is required");
    }
    if (transcript.length < 20) {
        throw new Error(`Transcript too short to summarize = (${transcript} )`);
    }

    if (transcript.length > MAX_TRANSCRIPT_CHARS) {
        throw new Error(
            `Transcript too large (${transcript.length} chars). Try a shorter video.`
        );
    }

    // 1. Split transcript
    const chunks = chunkText(transcript);
    // console.log("CHUNKS:", chunks.length); // optional debugging

    // 2. Summarize each chunk (Map phase)
    const partialSummaries: string[] = [];
    for (const chunk of chunks) {
        const summary = await summarizeChunk(chunk, language);
        partialSummaries.push(summary);
    }

    // 3. Combine and reduce (Reduce phase)
    const combined = partialSummaries.join("\n\n");

    const finalSummary = await summarizeChunk(
        `Combine these partial summaries into one final summary in ${language}:\n\n${combined}`,
        language
    );

    return finalSummary.trim();
}
