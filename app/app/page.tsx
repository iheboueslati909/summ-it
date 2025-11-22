import { redirect } from 'next/navigation';
import { getSession, clearSession } from '@/lib/auth/session';
import { findUserById } from '@/lib/db/models/user';

export default async function AppPage() {
    const session = await getSession();

    if (!session) {
        redirect('/');
    }

    const user = await findUserById(session.userId);

    if (!user) {
        await clearSession();
        redirect('/');
    }

    return (
        <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
            <h1>Welcome to the App</h1>
            <p>Connected to workspace: <strong>{user.notion.workspaceName || user.notion.workspaceId}</strong></p>
            <p>Bot ID: <code>{user.notion.botId}</code></p>

            <form action="/api/auth/logout" method="POST">
                <button type="submit" style={{
                    marginTop: '1rem',
                    padding: '0.5rem 1rem',
                    cursor: 'pointer',
                }}>
                    Disconnect
                </button>
            </form>
        </main>
    );
}