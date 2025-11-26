import { JWTPayload } from 'jose';

export interface SessionPayload extends JWTPayload {
    userId: string;
    notionUserId: string;
}
