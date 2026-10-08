'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Field } from '@/components/ui';
import { api, errMsg } from '@/lib/client';

export default function SignupPage() {
  const [f, setF] = useState({ organizationName: '', fullName: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/auth/signup', { method: 'POST', body: f });
      window.location.href = '/vehicles?welcome=1';
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Create your fleet workspace</h1>
      {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <Field label="Business name">
        <input className="input" required placeholder="e.g. Mogiddel Investment" value={f.organizationName} onChange={set('organizationName')} />
      </Field>
      <Field label="Your name">
        <input className="input" required value={f.fullName} onChange={set('fullName')} />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Email">
          <input className="input" type="email" required value={f.email} onChange={set('email')} />
        </Field>
        <Field label="Phone">
          <input className="input" value={f.phone} onChange={set('phone')} />
        </Field>
      </div>
      <Field label="Password (8+ characters)">
        <input className="input" type="password" minLength={8} required value={f.password} onChange={set('password')} />
      </Field>
      <button className="btn-primary w-full" disabled={busy}>
        {busy ? 'Creating…' : 'Create workspace'}
      </button>
      <p className="text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-brand-600">
          Sign in
        </Link>
      </p>
    </form>
  );
}
