'use client';

import { Bus, Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useCanManage, useSession } from '@/components/session-context';
import { Empty, Field, Loading, Modal, PageHeader } from '@/components/ui';
import { api, errMsg } from '@/lib/client';
import type { Vehicle } from '@/lib/types';

type Form = { registration: string; nickname: string; makeModel: string; capacity: string; sacco: string; route: string; status: 'active' | 'inactive'; notes: string };
const blank: Form = { registration: '', nickname: '', makeModel: '', capacity: '', sacco: '', route: '', status: 'active', notes: '' };

export default function VehiclesPage() {
  const canManage = useCanManage();
  const isOwner = useSession().role === 'owner';
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [editing, setEditing] = useState<{ id?: string; form: Form } | null>(null);
  const [welcome, setWelcome] = useState(false);

  const load = useCallback(() => api<Vehicle[]>('/vehicles').then(setVehicles), []);
  useEffect(() => {
    load();
    setWelcome(new URLSearchParams(window.location.search).has('welcome'));
  }, [load]);

  function open(v?: Vehicle) {
    setEditing({
      id: v?.id,
      form: v
        ? { registration: v.registration, nickname: v.nickname ?? '', makeModel: v.makeModel ?? '', capacity: v.capacity ? String(v.capacity) : '', sacco: v.sacco ?? '', route: v.route ?? '', status: v.status, notes: v.notes ?? '' }
        : blank,
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const f = editing.form;
    const body = { ...f, capacity: f.capacity ? Number(f.capacity) : null };
    try {
      if (editing.id) await api(`/vehicles/${editing.id}`, { method: 'PUT', body });
      else await api('/vehicles', { method: 'POST', body });
      toast.success('Vehicle saved');
      setEditing(null);
      setWelcome(false);
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  }

  async function remove(id: string) {
    if (!confirm('Remove this vehicle? Its past entries stay in reports.')) return;
    try {
      await api(`/vehicles/${id}`, { method: 'DELETE' });
      setEditing(null);
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  }

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    editing && setEditing({ ...editing, form: { ...editing.form, [k]: e.target.value } });

  return (
    <div>
      <PageHeader
        title="Vehicles"
        subtitle="Matatus, buses and shuttles in your fleet"
        actions={
          canManage && (
            <button type="button" className="btn-primary" onClick={() => open()}>
              <Plus size={16} /> Add vehicle
            </button>
          )
        }
      />
      {welcome && (
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          Welcome! Start by adding your vehicles. Then add your drivers/conductors under <b>Team</b> so they can record daily collections from the Android app.
        </div>
      )}
      {!vehicles ? (
        <Loading />
      ) : !vehicles.length ? (
        <Empty>No vehicles yet.</Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v) => (
            <button key={v.id} type="button" disabled={!canManage} onClick={() => open(v)} className="card p-4 text-left transition enabled:hover:border-brand-500">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-brand-50 p-2 text-brand-600">
                    <Bus size={20} />
                  </div>
                  <div>
                    <div className="font-semibold">{v.registration}</div>
                    {v.nickname && <div className="text-xs text-slate-500">{v.nickname}</div>}
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs ${v.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{v.status}</span>
              </div>
              <dl className="mt-3 space-y-1 text-xs text-slate-600">
                {v.route && <div>Route: {v.route}</div>}
                {v.sacco && <div>Sacco: {v.sacco}</div>}
                {(v.makeModel || v.capacity) && <div>{[v.makeModel, v.capacity && `${v.capacity} seats`].filter(Boolean).join(' · ')}</div>}
              </dl>
            </button>
          ))}
        </div>
      )}
      {editing && (
        <Modal title={editing.id ? 'Edit vehicle' : 'Add vehicle'} onClose={() => setEditing(null)} wide>
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <Field label="Registration *">
              <input className="input uppercase" required value={editing.form.registration} onChange={set('registration')} placeholder="KCX 123A" />
            </Field>
            <Field label="Short name (used in reports)">
              <input className="input" value={editing.form.nickname} onChange={set('nickname')} placeholder="KCX" />
            </Field>
            <Field label="Route">
              <input className="input" value={editing.form.route} onChange={set('route')} />
            </Field>
            <Field label="Sacco">
              <input className="input" value={editing.form.sacco} onChange={set('sacco')} />
            </Field>
            <Field label="Make / model">
              <input className="input" value={editing.form.makeModel} onChange={set('makeModel')} />
            </Field>
            <Field label="Seats">
              <input className="input" type="number" min={1} value={editing.form.capacity} onChange={set('capacity')} />
            </Field>
            <Field label="Status">
              <select className="input" value={editing.form.status} onChange={set('status')}>
                <option value="active">Active</option>
                <option value="inactive">Inactive (off the road)</option>
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Notes">
                <textarea className="input" rows={2} value={editing.form.notes} onChange={set('notes')} />
              </Field>
            </div>
            <div className="flex justify-between gap-2 sm:col-span-2">
              {editing.id && isOwner ? (
                <button type="button" className="btn-ghost text-red-600" onClick={() => remove(editing.id!)}>
                  Remove
                </button>
              ) : (
                <span />
              )}
              <button className="btn-primary">Save</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
