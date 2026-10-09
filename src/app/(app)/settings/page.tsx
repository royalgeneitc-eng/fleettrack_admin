'use client';

import { Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useSession } from '@/components/session-context';
import { Field, Modal, PageHeader } from '@/components/ui';
import { api, errMsg } from '@/lib/client';
import type { AppRelease } from '@/lib/app-release';
import type { CategoryKind, CategoryTag, ExpenseCategory } from '@/lib/types';

export default function SettingsPage() {
  const user = useSession();
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" />
      {user.role === 'owner' && <OrgSettings />}
      <MobileApp />
      <Categories />
      <Password />
    </div>
  );
}

function OrgSettings() {
  const org = useSession().organization!;
  const [f, setF] = useState({ name: org.name, currency: org.currency, phone: org.phone ?? '', email: org.email ?? '', logoUrl: org.logoUrl ?? '', tagline: org.tagline ?? '' });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api('/organization', { method: 'PUT', body: f });
      toast.success('Saved');
      window.location.reload();
    } catch (err) {
      toast.error(errMsg(err));
    }
  }
  return (
    <form onSubmit={save} className="card p-5">
      <h2 className="mb-1 font-semibold">Workspace</h2>
      <p className="mb-4 text-sm text-slate-500">Name, logo and contacts appear in the menu, on the mobile app and on your monthly closing reports.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Business name">
          <input className="input" required value={f.name} onChange={set('name')} />
        </Field>
        <Field label="Tagline">
          <input className="input" value={f.tagline} onChange={set('tagline')} placeholder="Real Estate Made Simple" />
        </Field>
        <Field label="Phone">
          <input className="input" value={f.phone} onChange={set('phone')} />
        </Field>
        <Field label="Email">
          <input className="input" type="email" value={f.email} onChange={set('email')} />
        </Field>
        <div className="sm:col-span-2">
          <LogoPicker value={f.logoUrl} onChange={(logoUrl) => setF({ ...f, logoUrl })} />
        </div>
        <Field label="Currency (ISO code)">
          <input className="input uppercase" maxLength={3} required value={f.currency} onChange={set('currency')} />
        </Field>
      </div>
      <div className="mt-4 flex justify-end">
        <button className="btn-primary">Save</button>
      </div>
    </form>
  );
}

/** Company logo: upload (resized to 256px in the browser, stored with the workspace) or paste a link. */
function LogoPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [busy, setBusy] = useState(false);
  async function pick(file: File) {
    if (!file.type.startsWith('image/')) return toast.error('Choose an image file (PNG, JPG or WebP)');
    setBusy(true);
    try {
      const bmp = await createImageBitmap(file);
      const scale = Math.min(1, 256 / Math.max(bmp.width, bmp.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bmp.width * scale);
      canvas.height = Math.round(bmp.height * scale);
      canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
      // PNG keeps transparency; fall back to JPEG if the PNG is unexpectedly heavy.
      let url = canvas.toDataURL('image/png');
      if (url.length > 300_000) url = canvas.toDataURL('image/jpeg', 0.9);
      onChange(url);
    } catch {
      toast.error('Could not read that image');
    } finally {
      setBusy(false);
    }
  }
  const isUpload = value.startsWith('data:');
  return (
    <div>
      <span className="label">Company logo</span>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value || '/logo.png'} alt="" className="h-full w-full object-contain p-1.5" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <label className="btn-secondary cursor-pointer">
              {busy ? 'Processing…' : value ? 'Change logo' : 'Upload logo'}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && pick(e.target.files[0])} />
            </label>
            {value && (
              <button type="button" className="btn-ghost text-red-600" onClick={() => onChange('')}>
                Remove
              </button>
            )}
          </div>
          <input
            className="input"
            type="url"
            value={isUpload ? '' : value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={isUpload ? 'Uploaded image (or paste a link to replace it)' : 'or paste a link: https://…'}
          />
          <p className="text-xs text-slate-500">Square images work best. Without a logo, the FleetTrack logo is shown.</p>
        </div>
      </div>
    </div>
  );
}

/** Latest Android release (self-hosted updater) with a download link to share with drivers. */
function MobileApp() {
  const [rel, setRel] = useState<AppRelease | null | undefined>(undefined);
  useEffect(() => {
    api<{ release: AppRelease | null }>('/app/latest')
      .then((r) => setRel(r.release))
      .catch(() => setRel(null));
  }, []);
  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" className="h-12 w-12" />
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">FleetTrack mobile app</h2>
          <p className="text-sm text-slate-500">
            {rel === undefined
              ? 'Checking for the latest version…'
              : rel
                ? `Latest version ${rel.versionName} · ${(rel.size / 1_048_576).toFixed(1)} MB${rel.minVersionCode > 0 ? ' · required update' : ''}`
                : 'No app release has been published yet.'}
          </p>
        </div>
        {rel && (
          <a href="/api/v1/app/download?redirect=1" className="btn-primary">
            Download APK
          </a>
        )}
      </div>
      {rel?.notes && <p className="mt-3 whitespace-pre-line rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{rel.notes}</p>}
      <p className="mt-3 text-xs text-slate-500">
        Installed apps update themselves: they show an “Update available” card and install with one tap. Share this APK with new drivers;
        on first install Android asks to allow installs from this source.
      </p>
    </div>
  );
}

type CatForm = { id?: string; name: string; kind: CategoryKind; tag: CategoryTag; sortOrder: number; active: boolean };

function Categories() {
  const [cats, setCats] = useState<ExpenseCategory[]>([]);
  const [form, setForm] = useState<CatForm | null>(null);
  const load = useCallback(() => api<ExpenseCategory[]>('/categories?all=1').then(setCats), []);
  useEffect(() => {
    load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const { id, ...body } = form;
    try {
      if (id) await api(`/categories/${id}`, { method: 'PUT', body });
      else await api('/categories', { method: 'POST', body });
      setForm(null);
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  }
  async function remove(id: string) {
    const r = await api<{ deactivated: boolean }>(`/categories/${id}`, { method: 'DELETE' });
    toast.success(r.deactivated ? 'Category has history, so it was deactivated instead' : 'Category removed');
    setForm(null);
    load();
  }

  const group = (kind: CategoryKind, title: string, help: string) => (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-slate-500">{help}</p>
        </div>
        <button type="button" className="btn-ghost" onClick={() => setForm({ name: '', kind, tag: null, sortOrder: cats.length, active: true })}>
          <Plus size={16} /> Add
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {cats
          .filter((c) => c.kind === kind)
          .map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setForm({ id: c.id, name: c.name, kind: c.kind, tag: c.tag, sortOrder: c.sortOrder, active: c.active })}
              className={`rounded-full border px-3 py-1 text-sm ${c.active ? 'border-slate-300' : 'border-dashed border-slate-300 text-slate-400 line-through'}`}
            >
              {c.name}
              {c.tag && <span className="ml-1 text-xs text-brand-600">· {c.tag}</span>}
            </button>
          ))}
      </div>
    </div>
  );

  return (
    <div className="card space-y-6 p-5">
      <div>
        <h2 className="font-semibold">Expense categories</h2>
        <p className="text-sm text-slate-500">Daily categories appear as fields on every daily entry.</p>
      </div>
      {group('daily', 'Daily operating expenses', 'Fuel, sacco, driver, gate, police, car wash…')}
      {group('fixed', 'Monthly fixed expenses', 'Insurance, county parking, service, wages, tithe…')}
      {form && (
        <Modal title={form.id ? 'Edit category' : 'Add category'} onClose={() => setForm(null)}>
          <form onSubmit={save} className="space-y-4">
            <Field label="Name">
              <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Report as">
              <select className="input" value={form.tag ?? ''} onChange={(e) => setForm({ ...form, tag: (e.target.value || null) as CategoryTag })}>
                <option value="">Normal expense</option>
                <option value="driver">Driver payment</option>
                <option value="wages">Wages to other employees</option>
                <option value="tithe">Tithe</option>
              </select>
            </Field>
            <Field label="Order">
              <input className="input" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
            </Field>
            {form.id && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active
              </label>
            )}
            <div className="flex justify-between">
              {form.id ? (
                <button type="button" className="btn-ghost text-red-600" onClick={() => remove(form.id!)}>
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

function Password() {
  const [f, setF] = useState({ currentPassword: '', newPassword: '' });
  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api('/auth/password', { method: 'PUT', body: f });
      toast.success('Password changed');
      setF({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(errMsg(err));
    }
  }
  return (
    <form onSubmit={save} className="card max-w-xl p-5">
      <h2 className="mb-4 font-semibold">Change password</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Current password">
          <input className="input" type="password" required value={f.currentPassword} onChange={(e) => setF({ ...f, currentPassword: e.target.value })} />
        </Field>
        <Field label="New password">
          <input className="input" type="password" minLength={8} required value={f.newPassword} onChange={(e) => setF({ ...f, newPassword: e.target.value })} />
        </Field>
      </div>
      <div className="mt-4 flex justify-end">
        <button className="btn-primary">Update password</button>
      </div>
    </form>
  );
}
