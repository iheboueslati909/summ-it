import { SparklesCore } from "@/components/ui/shadcn-io/sparkles";
import { useMemo } from "react";

export default function HeroSection() {
    const sparklesBackground = useMemo(() => (
        <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
            <SparklesCore
                background="transparent"
                minSize={0.6}
                maxSize={1.6}
                particleDensity={60}
                className="w-full h-full"
                particleColor="#ff0073ff"
                speed={1}
            />
        </div>
    ), []); // Empty dependency array = only creates once
    return (
        <div className="text-center space-y-6 max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground leading-tight">
                Summarize Anything <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                    in Seconds.
                </span>
                {sparklesBackground}

            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                Turn long videos into concise, actionable notes. Save time and boost productivity with our advanced AI.

            </p>

        </div>
    );
}