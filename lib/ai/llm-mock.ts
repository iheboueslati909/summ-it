// lib/llm-mock.ts

interface LLM {
    summarizeTranscript(transcript: string, lang: string): Promise<string>;
}
export class MockLLM implements LLM {
    async summarizeTranscript(transcript: string, lang: string): Promise<string> {
        return `MOCK SUMMARY (${lang}): ${transcript.substring(0, 120)}...`;
    }
}
