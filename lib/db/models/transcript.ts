import { ObjectId } from 'mongodb';
import { getDb } from '../mongodb';
import { TranscriptResult } from '@/types';

export interface CachedTranscript {
    _id?: ObjectId;
    videoId: string;
    transcript: TranscriptResult;
    createdAt: Date;
}

let indexesCreated = false;

async function ensureIndexes() {
    if (indexesCreated) return;
    const db = await getDb();
    const collection = db.collection<CachedTranscript>('transcripts');

    await collection.createIndex({ videoId: 1 }, { unique: true });
    // TTL index: expire after 30 days (30 * 24 * 60 * 60 seconds)
    await collection.createIndex({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

    indexesCreated = true;
}

export async function findCachedTranscript(videoId: string): Promise<CachedTranscript | null> {
    const db = await getDb();
    return db.collection<CachedTranscript>('transcripts').findOne({ videoId });
}

export async function saveTranscriptToCache(videoId: string, transcript: TranscriptResult) {
    await ensureIndexes();
    const db = await getDb();
    const now = new Date();

    await db.collection<CachedTranscript>('transcripts').updateOne(
        { videoId },
        {
            $set: {
                videoId,
                transcript,
                createdAt: now
            }
        },
        { upsert: true }
    );
}

export function extractVideoId(url: string): string | null {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}
