export interface LLM {
    summarizeTranscript(transcript: string, lang: string): Promise<string>;
}