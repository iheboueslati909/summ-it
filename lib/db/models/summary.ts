import { ObjectId } from 'mongodb';
import { getDb } from '../mongodb';

export interface Summary {
    _id?: ObjectId;
    userId: string;
    videoUrl: string;
    videoId?: string;
    title: string;
    content: string;
    summaryType?: string;
    language?: string;
    createdAt: Date;
    updatedAt: Date;
    availableLanguages: string[];
}

export async function createSummary(data: Omit<Summary, '_id' | 'createdAt' | 'updatedAt'>) {
    const db = await getDb();
    const now = new Date();

    const result = await db.collection<Summary>('summaries').insertOne({
        ...data,
        createdAt: now,
        updatedAt: now,
    });

    return result;
}

export async function getUserHistory(userId: string, limit = 50, skip = 0) {
    const db = await getDb();
    return db.collection<Summary>('summaries')
        .find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
}

export async function getSummaryById(id: string) {
    const db = await getDb();
    return db.collection<Summary>('summaries').findOne({ _id: new ObjectId(id) });
}

export async function updateSummary(id: string, userId: string, data: Partial<Summary>) {
    const db = await getDb();
    return db.collection<Summary>('summaries').updateOne(
        { _id: new ObjectId(id), userId }, // Ensure user owns the summary
        {
            $set: {
                ...data,
                updatedAt: new Date()
            }
        }
    );
}

export async function deleteSummary(id: string, userId: string) {
    const db = await getDb();
    return db.collection<Summary>('summaries').deleteOne({
        _id: new ObjectId(id),
        userId
    });
}
