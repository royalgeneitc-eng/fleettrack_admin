'use client';

import { createContext, useContext } from 'react';
import type { SessionUser } from '@/lib/types';

const Ctx = createContext<SessionUser | null>(null);

export function SessionProvider({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  return <Ctx.Provider value={user}>{children}</Ctx.Provider>;
}

export function useSession() {
  const u = useContext(Ctx);
  if (!u) throw new Error('useSession outside SessionProvider');
  return u;
}

export function useCurrency() {
  const c = useSession().organization?.currency ?? 'KES';
  return c === 'KES' ? 'KSh' : c;
}

export const useCanManage = () => {
  const r = useSession().role;
  return r === 'owner' || r === 'manager';
};
