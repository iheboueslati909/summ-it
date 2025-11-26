import { Redis } from '@upstash/redis';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const WINDOW = 60_000; // 60 seconds
const LIMIT = 15;
const KEY = "gemini:rate";

export async function acquireToken(): Promise<void> {
    while (true) {
        const now = Date.now();

        const res = await redis.eval(
            `
            local key     = KEYS[1]
            local now     = tonumber(ARGV[1])
            local window  = tonumber(ARGV[2])
            local limit   = tonumber(ARGV[3])

            -- remove old entries
            redis.call("ZREMRANGEBYSCORE", key, 0, now - window)

            -- count
            local count = redis.call("ZCARD", key)

            if count < limit then
                redis.call("ZADD", key, now, now)
                redis.call("EXPIRE", key, 120)
                return 0
            else
                local data = redis.call("ZRANGE", key, 0, 0, "WITHSCORES")
                local oldest = tonumber(data[2])
                local wait = window - (now - oldest)
                return wait
            end
            `,
            [KEY],
            [now, WINDOW, LIMIT]
        );

        const waitMs = Number(res);

        if (waitMs === 0) return; // Allowed → exit

        // Throttled → wait exactly what’s needed
        await new Promise(r => setTimeout(r, waitMs));
    }
}
