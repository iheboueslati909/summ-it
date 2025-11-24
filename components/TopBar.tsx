
'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { History } from 'lucide-react';

interface TopBarProps {
    workspaceName?: string;
}

export function TopBar({ workspaceName }: TopBarProps) {
    const router = useRouter();
    const pathname = usePathname();

    async function handleLogout() {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/');
    }

    return (
        <header className="flex justify-between items-center px-6 py-3 bg-background border-b">
            <Link href="/app" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <span className="text-xl">📺</span>
                <span className="font-semibold text-sm text-foreground">
                    YouTube → Notion
                </span>
            </Link>

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