export async function retry<T>(
    fn: () => Promise<T>,
    {
        retries = 3,
        baseDelayMs = 500,
        onRetry,
    }: {
        retries?: number;
        baseDelayMs?: number;
        onRetry?: (error: any, attempt: number) => void;
    } = {}
): Promise<T> {
    let attempt = 0;

    while (true) {
        try {
            return await fn();
        } catch (err: any) {
            attempt++;

            const isLast = attempt > retries;
            const isRateLimit = err?.status === 429 || err?.message?.includes("rate");
            const isServerError = err?.status >= 500;
            const isSafetyBlock = err?.message?.includes("safety");

            // permanent failure → no retry
            const isPermanent =
                !isRateLimit &&
                !isServerError &&
                !isSafetyBlock;

            if (isPermanent || isLast) {
                throw err;
            }

            onRetry?.(err, attempt);

            // exponential backoff
            const delay = baseDelayMs * Math.pow(2, attempt - 1);
            await new Promise(r => setTimeout(r, delay));
        }
    }
}
