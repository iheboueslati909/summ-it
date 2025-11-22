// lib/llm-gemini.ts
import { LLM } from "./llm";
import { GoogleGenerativeAI } from "@google/generative-ai";

export class GeminiLLM implements LLM {
    private model;

    constructor(apiKey: string) {
        const genAI = new GoogleGenerativeAI(apiKey);
        this.model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    }

    async summarizeTranscript(transcript: string, lang: string): Promise<string> {
        const prompt = `Summarize in ${lang}: ${transcript}`;
        const result = await this.model.generateContent(prompt);
        return result.response.text();
    }
}
