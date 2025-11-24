import { GoogleGenerativeAI } from "@google/generative-ai";
import { retry } from "./retry-helper";

const USE_MOCK_LLM = process.env.USE_MOCK_LLM === "true";
const MAX_CHARS_PER_CHUNK = 6000;
const MAX_TRANSCRIPT_CHARS = 200000;
const CHUNK_OVERLAP = 400;

let model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]> | null = null;

if (!USE_MOCK_LLM) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not defined");
    }
    const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = client.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
}

function chunkTextSmart(text: string, maxSize = MAX_CHARS_PER_CHUNK): string[] {
    const chunks: string[] = [];
    let current = "";

    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

    for (const sentence of sentences) {
        const trimmed = sentence.trim();
        if (!trimmed) continue;

        if ((current + trimmed).length > maxSize && current.length > 0) {
            chunks.push(current.trim());
            current = sentences.slice(-3).join("").trim();
        }

        current += " " + trimmed;
    }

    if (current.trim().length > 0) {
        chunks.push(current.trim());
    }

    return chunks.filter(c => c.length > 50);
}

const CHUNK_SUMMARY_PROMPT = (text: string, language: string, chunkNum: number, totalChunks: number) => `
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

const SYNTHESIS_PROMPT = (summaries: string[], language: string) => `
You are a master editor. Your job is to synthesize these partial summaries into ONE cohesive final summary.

CRITICAL INSTRUCTIONS:
1. Remove redundancy
2. Organize by theme
3. Preserve important details
4. Output in ${language}
5. Format: Opening + key sections + conclusion
6. Target length: 8–12 paragraphs

PARTIAL SUMMARIES:
${summaries.map((s, i) => `--- Summary ${i + 1} ---\n${s}`).join("\n\n")}

FINAL:`;

export async function summarizeChunk(
    text: string,
    language: string,
    chunkNum = 1,
    totalChunks = 1
): Promise<string> {

    if (USE_MOCK_LLM) {
        return `MOCK SUMMARY (chunk ${chunkNum})`;
    }

    const prompt = CHUNK_SUMMARY_PROMPT(text, language, chunkNum, totalChunks);

    try {
        const summary = await retry(async () => {
            const result = await model!.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.3,
                    topP: 0.9
                },
            });

            const output = result.response.text().trim();

            if (!output) {
                throw new Error(`Empty LLM response on chunk ${chunkNum}`);
            }

            return output;
        }, {
            retries: 3,
            baseDelayMs: 600,
            onRetry: (err, attempt) => {
                console.warn(
                    `⚠️ Chunk ${chunkNum} retry ${attempt}/3 — Reason: ${err?.message}`
                );
            }
        });

        return summary;

    } catch (err) {
        console.error(`❌ Chunk ${chunkNum} failed after retries`, err);

        // isolate the damage: produce a stable fallback
        return [
            `⚠️ **FALLBACK SUMMARY FOR CHUNK ${chunkNum}**`,
            `The AI model failed to summarize this section after multiple attempts.`,
            ``,
            `🧩 Chunk preview (truncated):`,
            text.substring(0, 400) + "...",
        ].join("\n");
    }
}

export async function summarizeTranscript({
    transcript,
    language,
}: {
    transcript: string;
    language: string;
}): Promise<string> {

    if (!transcript) throw new Error("Transcript is required");
    if (transcript.length < 50) throw new Error("Transcript too short");
    if (transcript.length > MAX_TRANSCRIPT_CHARS)
        throw new Error(`Transcript too large (${transcript.length} chars)`);

    // 1) Chunking
    const chunks = chunkTextSmart(transcript);
    console.log(`Generated ${chunks.length} chunks`);

    if (chunks.length === 0) throw new Error("No valid chunks created");

    // 2) Chunk summarization
    const partialSummaries = await Promise.all(
        chunks.map((chunk, idx) => summarizeChunk(chunk, language, idx + 1, chunks.length))
    );

    // 3) If tiny transcript → skip synthesis
    if (chunks.length <= 2) {
        console.log("Small transcript → returning merged partial summaries");
        return partialSummaries.join("\n\n");
    }

    // 4) Synthesis stage (with failover)
    try {
        const synthesis = await model!.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [{ text: SYNTHESIS_PROMPT(partialSummaries, language) }],
                },
            ],
            generationConfig: {
                temperature: 0.4,
                topP: 0.95,
            },
        });

        const final = synthesis.response.text().trim();
        if (!final) throw new Error("Empty synthesis output");

        return final;
    } catch (err) {
        console.error("❌ Synthesis failed", err);

        // Last-resort fallback
        return [
            "⚠️ **FINAL SYNTHESIS FAILED — Using raw chunk summaries instead**",
            "",
            ...partialSummaries
        ].join("\n\n");
    }
}
