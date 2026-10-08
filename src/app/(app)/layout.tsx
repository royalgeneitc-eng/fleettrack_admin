import { redirect } from 'next/navigation';
import { SessionProvider } from '@/components/session-context';
import { AppShell } from '@/components/sidebar';
import { getSessionUser } from '@/lib/auth.server';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  // Token valid but user gone/deactivated: ?expired lets the middleware drop the cookie instead of looping.
  if (!user) redirect('/login?expired=1');
  return (
    <SessionProvider user={user}>
      <AppShell>
        {user.organization?.status === 'suspended' ? (
          <div className="card p-8 text-center">This workspace is suspended. Contact support to restore access.</div>
        ) : (
          children
        )}
      </AppShell>
    </SessionProvider>
  );
}
