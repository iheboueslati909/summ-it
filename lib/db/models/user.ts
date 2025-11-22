import { ObjectId } from 'mongodb';
import { getDb } from '../mongodb';

export interface NotionTokens {
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    botId: string;
    workspaceId: string;
    workspaceName?: string;
}

export interface User {
    _id?: ObjectId;
    notionUserId: string;
    email?: string;
    notion: Partial<NotionTokens>;
    createdAt: Date;
    updatedAt: Date;
}

export async function findUserByNotionId(notionUserId: string) {
    const db = await getDb();
    return db.collection<User>('users').findOne({ notionUserId });
}

export async function findUserById(id: string) {
    const db = await getDb();
    return db.collection<User>('users').findOne({ _id: new ObjectId(id) });
}

export async function upsertUser(data: Omit<User, '_id' | 'createdAt' | 'updatedAt'>) {
    const db = await getDb();
    const now = new Date();

    const result = await db.collection<User>('users').findOneAndUpdate(
        { notionUserId: data.notionUserId },
        {
            $set: { ...data, updatedAt: now },
            $setOnInsert: { createdAt: now },
        },
        { upsert: true, returnDocument: 'after' }
    );

    return result;
}

export async function updateUserTokens(userId: string, tokens: Partial<NotionTokens>) {

    const db = await getDb();
    return db.collection<User>('users').updateOne(
        { _id: new ObjectId(userId) },
        { $set: { 'notion': tokens, updatedAt: new Date() } }
    );
}
