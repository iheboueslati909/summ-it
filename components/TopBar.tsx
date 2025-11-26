
'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from "next/image";

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
                <div className="h-8 flex items-center">
                    <Image
                        src="/logo.png"
                        alt="logo"
                        width={384}
                        height={192}
                        className="h-full w-auto"
                    />
                </div>
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