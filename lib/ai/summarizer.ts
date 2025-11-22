// lib/ai/summarizer.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- MOCK MODE FLAG ---
// Set to true to skip Gemini calls for testing
const USE_MOCK_LLM = process.env.USE_MOCK_LLM === "true";

let model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]> | null = null;

if (!USE_MOCK_LLM) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not defined");
    }

    const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = client.getGenerativeModel({ model: "gemini-2.5-flash" });
}

export async function summarizeTranscript({
    transcript,
    language,
}: {
    transcript: string;
    language: string;
}): Promise<string> {
    if (!transcript || transcript.length < 20) {
        throw new Error("Transcript too short to summarize");
    }

    // --- MOCK IMPLEMENTATION ---
    if (USE_MOCK_LLM) {
        return `MOCK SUMMARY (${language}): ${transcript.substring(0, 120)}...`;
    }

    // --- GEMINI CALL ---
    const prompt = `
You are a professional content summarizer.
Summarize the following YouTube transcript clearly in ${language}.
Do NOT hallucinate missing parts. 
Make the result structured and readable.

Transcript:
${transcript}
`;

    const result = await model!.generateContent(prompt);
    const summary = result.response.text();

    if (!summary || summary.length < 10) {
        throw new Error("Gemini returned an empty summary");
    }

    return summary.trim();
}
