const MAX_CHARS_PER_CHUNK = 6000;
const MAX_TRANSCRIPT_CHARS = 200000;

export function chunkTextSmart(text: string, maxSize = MAX_CHARS_PER_CHUNK): string[] {
    const chunks: string[] = [];
    let current = "";

    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

    for (const sentence of sentences) {
        const trimmed = sentence.trim();
        if (!trimmed) continue;

        if ((current + " " + trimmed).length > maxSize && current.length > 0) {
            chunks.push(current.trim());
            current = trimmed;
        } else {
            current += " " + trimmed;
        }
    }

    if (current.trim().length > 0) chunks.push(current.trim());

    return chunks.filter(c => c.length > 50);
}

export function extractTitle(text: string) {
    if (!text) return "Untitled Summary";

    const match = text.match(/(.+?)(?<!\b[A-Z])([.!?])\s+(?=[A-Z])/);

    let sentence = match ? match[1] + match[2] : text;

    sentence = sentence.trim().substring(0, 150);

    return sentence || "Untitled Summary";
}


export function verifyTranscript(transcript: string) {
    if (!transcript) throw new Error("Transcript is required");
    if (transcript.length < 300) throw new Error("Transcript too short");
    // if (transcript.length > MAX_TRANSCRIPT_CHARS) {
    //     transcript = transcript.slice(0, MAX_TRANSCRIPT_CHARS);
    // }
}