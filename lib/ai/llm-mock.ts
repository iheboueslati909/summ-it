// lib/llm-mock.ts
import { LLM } from "./llm";

export class MockLLM implements LLM {
    async summarizeTranscript(transcript: string, lang: string): Promise<string> {
        return `MOCK SUMMARY (${lang}): ${transcript.substring(0, 120)}...`;
    }
}
