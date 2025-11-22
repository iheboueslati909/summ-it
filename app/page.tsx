import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { findUserById } from '@/lib/db/models/user';

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // Check if user already has valid session
  const session = await getSession();

  if (session) {
    // Verify user still exists in DB
    const user = await findUserById(session.userId);
    if (user) {
      redirect('/app');
    }
  }

  const params = await searchParams;
  const error = params.error;

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <h1 style={styles.title}>Connect Your Notion</h1>
        <p style={styles.subtitle}>
          Link your Notion workspace to get started
        </p>

        {error && (
          <div style={styles.error}>
            {error === 'access_denied'
              ? 'You denied access. Please try again.'
              : 'Something went wrong. Please try again.'}
          </div>
        )}

        <a href="/api/auth/notion" style={styles.button}>
          <NotionIcon />
          Connect Notion
        </a>
      </div>
    </main>
  );
}

function NotionIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 100 100" fill="currentColor">
      <path d="M6.017 4.313l55.333 -4.087c6.797 -0.583 8.543 -0.19 12.817 2.917l17.663 12.443c2.913 2.14 3.883 2.723 3.883 5.053v68.243c0 4.277 -1.553 6.807 -6.99 7.193L24.467 99.967c-4.08 0.193 -6.023 -0.39 -8.16 -3.113L3.3 79.94c-2.333 -3.113 -3.3 -5.443 -3.3 -8.167V11.113c0 -3.497 1.553 -6.413 6.017 -6.8z" />
    </svg>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#fafafa',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  container: {
    textAlign: 'center',
    padding: '3rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 600,
    color: '#111',
    margin: 0,
  },
  subtitle: {
    color: '#666',
    marginTop: '0.5rem',
    marginBottom: '2rem',
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.875rem 1.5rem',
    fontSize: '1rem',
    fontWeight: 500,
    color: '#fff',
    background: '#000',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'opacity 0.2s',
  },
  error: {
    padding: '0.75rem 1rem',
    marginBottom: '1.5rem',
    background: '#fef2f2',
    color: '#dc2626',
    borderRadius: '6px',
    fontSize: '0.875rem',
  },
};