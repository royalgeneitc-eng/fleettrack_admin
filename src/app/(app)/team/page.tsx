'use client';

import { Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useVehicles } from '@/components/filters';
import { useSession } from '@/components/session-context';
import { Field, Loading, Modal, PageHeader } from '@/components/ui';
import { api, errMsg } from '@/lib/client';
import type { Role } from '@/lib/types';

type Member = { id: string; fullName: string; email: string; phone: string | null; role: Role; active: boolean; lastLoginAt: string | null; vehicleIds: string[] };
type Form = { id?: string; fullName: string; email: string; phone: string; role: Role; password: string; active: boolean; vehicleIds: string[] };

const ROLE_HELP: Record<Role, string> = {
  owner: 'Full access including team and settings',
  manager: 'Sees all vehicles and reports, records monthly expenses',
  recorder: 'Driver / conductor / clerk — records daily entries for assigned vehicles only',
};

export default function TeamPage() {
  const me = useSession();
  const isOwner = me.role === 'owner';
  const vehicles = useVehicles();
  const [members, setMembers] = useState<Member[] | null>(null);
  const [form, setForm] = useState<Form | null>(null);

  const load = useCallback(() => api<Member[]>('/users').then(setMembers), []);
  useEffect(() => {
    load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const { id, password, ...rest } = form;
    const body = { ...rest, phone: rest.phone || null, ...(password ? { password } : {}) };
    try {
      if (id) await api(`/users/${id}`, { method: 'PUT', body });
      else await api('/users', { method: 'POST', body });
      toast.success(id ? 'Saved' : 'Team member added — share their email and password with them');
      setForm(null);
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  }

  const reg = (id: string) => vehicles.find((v) => v.id === id)?.registration ?? '…';

  return (
    <div>
      <PageHeader
        title="Team"
        subtitle="Owners, managers and the drivers/conductors who record daily collections"
        actions={
          isOwner && (
            <button type="button" className="btn-primary" onClick={() => setForm({ fullName: '', email: '', phone: '', role: 'recorder', password: '', active: true, vehicleIds: [] })}>
              <Plus size={16} /> Add member
            </button>
          )
        }
      />
      {!members ? (
        <Loading />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="border-b border-slate-200">
              <tr>
                <th className="th">Name</th>
                <th className="th">Role</th>
                <th className="th">Vehicles</th>
                <th className="th">Last sign-in</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((m) => (
                <tr
                  key={m.id}
                  className={`${isOwner ? 'cursor-pointer hover:bg-slate-50' : ''} ${m.active ? '' : 'opacity-50'}`}
                  onClick={() => isOwner && setForm({ id: m.id, fullName: m.fullName, email: m.email, phone: m.phone ?? '', role: m.role, password: '', active: m.active, vehicleIds: m.vehicleIds })}
                >
                  <td className="td">
                    <div className="font-medium">
                      {m.fullName} {!m.active && <span className="text-xs text-slate-500">(deactivated)</span>}
                    </div>
                    <div className="text-xs text-slate-500">{m.email}</div>
                  </td>
                  <td className="td capitalize">{m.role === 'recorder' ? 'Driver / recorder' : m.role}</td>
                  <td className="td text-slate-600">{m.role === 'recorder' ? m.vehicleIds.map(reg).join(', ') || <span className="text-amber-600">None assigned</span> : 'All'}</td>
                  <td className="td text-slate-500">{m.lastLoginAt ? new Date(m.lastLoginAt).toLocaleString() : 'Never'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {form && (
        <Modal title={form.id ? 'Edit team member' : 'Add team member'} onClose={() => setForm(null)}>
          <form onSubmit={save} className="space-y-4">
            <Field label="Full name">
              <input className="input" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Email (used to sign in)">
                <input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </Field>
              <Field label="Phone">
                <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Field>
            </div>
            <Field label="Role">
              <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
                <option value="recorder">Driver / recorder</option>
                <option value="manager">Manager</option>
                <option value="owner">Owner</option>
              </select>
              <p className="mt-1 text-xs text-slate-500">{ROLE_HELP[form.role]}</p>
            </Field>
            {form.role === 'recorder' && (
              <fieldset>
                <legend className="label">Assigned vehicles</legend>
                <div className="flex flex-wrap gap-2">
                  {vehicles.map((v) => {
                    const on = form.vehicleIds.includes(v.id);
                    return (
                      <button
                        type="button"
                        key={v.id}
                        onClick={() => setForm({ ...form, vehicleIds: on ? form.vehicleIds.filter((x) => x !== v.id) : [...form.vehicleIds, v.id] })}
                        className={`rounded-full border px-3 py-1 text-xs ${on ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 text-slate-600'}`}
                      >
                        {v.registration}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}
            <Field label={form.id ? 'New password (leave blank to keep)' : 'Initial password (8+ characters)'}>
              <input className="input" type="text" minLength={8} required={!form.id} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </Field>
            {form.id && form.id !== me.id && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active (can sign in)
              </label>
            )}
            <div className="flex justify-end">
              <button className="btn-primary">Save</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
