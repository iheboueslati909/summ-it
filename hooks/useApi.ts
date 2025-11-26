import { toast } from "sonner";

export function useApi() {
    async function request(url: string, options: RequestInit = {}) {
        try {
            const res = await fetch(url, options);

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));

                toast.error(err.message || "Request failed", {
                    description: err.hint || "Please try again.",
                });

                throw err;
            }

            return await res.json();
        } catch (err) {
            // Only show network error if we haven't already shown an API error
            if (err instanceof TypeError) {
                toast.error("Network error", {
                    description: "Check your connection and try again.",
                });
            }

            throw err;
        }
    }

    return { request };
}