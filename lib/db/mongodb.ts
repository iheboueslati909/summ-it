import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getDb(): Promise<Db> {
    if (db) return db;

    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not configured');

    // In dev, reuse connection across hot reloads
    const globalWithMongo = global as typeof globalThis & {
        _mongoClient?: MongoClient;
    };

    if (process.env.NODE_ENV === 'development' && globalWithMongo._mongoClient) {
        client = globalWithMongo._mongoClient;
    } else {
        client = new MongoClient(uri, {
            maxPoolSize: 10,
            minPoolSize: 1,
        });
        await client.connect();

        if (process.env.NODE_ENV === 'development') {
            globalWithMongo._mongoClient = client;
        }
    }

    db = client.db();
    return db;
}