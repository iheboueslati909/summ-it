import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { findUserById } from '@/lib/db/models/user';
import { TopBar } from './components/TopBar';

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session) redirect('/');

    const user = await findUserById(session.userId);
    if (!user) redirect('/');

    return (
        <div style={{ minHeight: '100vh' }}>
            <TopBar workspaceName={user.notion.workspaceName} />
            {children}
        </div>
    );
}