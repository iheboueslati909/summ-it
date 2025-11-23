'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TopBarProps {
    workspaceName?: string;
}

export function TopBar({ workspaceName }: TopBarProps) {
    const router = useRouter();

    async function handleLogout() {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/');
    }

    return (
        <header className="flex justify-between items-center px-6 py-3 bg-background border-b">
            <div className="flex items-center gap-2">
                <span className="text-xl">📺</span>
                <span className="font-semibold text-sm text-foreground">
                    YouTube → Notion
                </span>
            </div>

            <div className="flex items-center gap-4">
                {workspaceName && (
                    <Badge variant="secondary" className="text-xs">
                        {workspaceName}
                    </Badge>
                )}
                <Button
                    onClick={handleLogout}
                    variant="outline"
                    size="sm"
                >
                    Disconnect
                </Button>
            </div>
        </header>
    );
}