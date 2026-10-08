'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useSession } from '@/components/session-context';
import { Loading, PageHeader } from '@/components/ui';
import { api, errMsg } from '@/lib/client';

type Org = {
  id: string; name: string; slug: string; status: 'active' | 'suspended'; createdAt: string; ownerEmail: string | null;
  userCount: number; vehicleCount: number; entryCount: number; lastEntryDate: string | null;
};

export default function PlatformPage() {
  const user = useSession();
  const [orgs, setOrgs] = useState<Org[] | null>(null);
  const load = useCallback(() => api<Org[]>('/platform/organizations').then(setOrgs), []);
  useEffect(() => {
    if (user.isSuperAdmin) load();
  }, [load, user.isSuperAdmin]);

  if (!user.isSuperAdmin) return <div className="card p-8 text-center text-sm">Platform admins only.</div>;

  async function toggle(o: Org) {
    const status = o.status === 'active' ? 'suspended' : 'active';
    if (!confirm(`${status === 'suspended' ? 'Suspend' : 'Reactivate'} ${o.name}?`)) return;
    try {
      await api(`/platform/organizations/${o.id}`, { method: 'PATCH', body: { status } });
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  }

  return (
    <div>
      <PageHeader title="Platform" subtitle="All fleet workspaces" />
      {!orgs ? (
        <Loading />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="border-b border-slate-200">
              <tr>
                <th className="th">Workspace</th>
                <th className="th">Owner</th>
                <th className="th text-right">Users</th>
                <th className="th text-right">Vehicles</th>
                <th className="th text-right">Entries</th>
                <th className="th">Last entry</th>
                <th className="th">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orgs.map((o) => (
                <tr key={o.id}>
                  <td className="td">
                    <div className="font-medium">{o.name}</div>
                    <div className="text-xs text-slate-500">Created {new Date(o.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="td text-slate-600">{o.ownerEmail}</td>
                  <td className="td text-right">{o.userCount}</td>
                  <td className="td text-right">{o.vehicleCount}</td>
                  <td className="td text-right">{o.entryCount}</td>
                  <td className="td text-slate-600">{o.lastEntryDate ? String(o.lastEntryDate).slice(0, 10) : '—'}</td>
                  <td className="td">
                    <button type="button" onClick={() => toggle(o)} className={`rounded-full px-2 py-0.5 text-xs ${o.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {o.status}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
