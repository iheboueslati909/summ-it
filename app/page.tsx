import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { findUserById } from '@/lib/db';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
    <main className="min-h-screen flex items-center justify-center bg-background font-sans p-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Connect Your Notion</CardTitle>
          <CardDescription className="text-lg mt-2">
            Link your Notion workspace to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6 pt-6">
          {error && (
            <div className="w-full p-3 mb-2 bg-destructive/10 text-destructive rounded-md text-sm">
              {error === 'access_denied'
                ? 'You denied access. Please try again.'
                : 'Something went wrong. Please try again.'}
            </div>
          )}

          <form action="/api/auth/notion" method="GET">
            <Button
              size="lg"
              className="w-full"
              type="submit"
            >
              <NotionIcon className="mr-2 h-5 w-5" />
              Connect Notion
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

function NotionIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 100 100" fill="currentColor">
      <path d="M6.017 4.313l55.333 -4.087c6.797 -0.583 8.543 -0.19 12.817 2.917l17.663 12.443c2.913 2.14 3.883 2.723 3.883 5.053v68.243c0 4.277 -1.553 6.807 -6.99 7.193L24.467 99.967c-4.08 0.193 -6.023 -0.39 -8.16 -3.113L3.3 79.94c-2.333 -3.113 -3.3 -5.443 -3.3 -8.167V11.113c0 -3.497 1.553 -6.413 6.017 -6.8z" />
    </svg>
  );
}