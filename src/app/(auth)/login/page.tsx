'use client';

import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Field } from '@/components/ui';
import { api, errMsg } from '@/lib/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [forgot, setForgot] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { user } = await api<{ user: { organizationId: string | null; isSuperAdmin: boolean } }>('/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      const next = new URLSearchParams(window.location.search).get('next');
      window.location.href = next?.startsWith('/') ? next : !user.organizationId && user.isSuperAdmin ? '/platform' : '/';
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-slate-500">Welcome back. Sign in to manage your fleet.</p>
      </div>
      {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <Field label="Email">
        <div className="relative">
          <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
      </Field>
      <Field label="Password">
        <div className="relative">
          <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input px-9" type={show ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600">
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </Field>
      <div className="flex justify-end">
        <button type="button" onClick={() => setForgot((f) => !f)} className="text-sm font-medium text-brand-600">
          Forgot password?
        </button>
      </div>
      {forgot && (
        <p className="rounded-xl bg-brand-50 p-3 text-sm text-slate-700">
          Ask your fleet owner or manager to set a new password for you under <b>Team</b>. Then sign in and change it in Settings.
        </p>
      )}
      <button className="btn-primary w-full py-3" disabled={busy || !email || !password}>
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
      <p className="text-center text-sm text-slate-500">
        New fleet owner?{' '}
        <Link href="/signup" className="font-medium text-brand-600">
          Create a workspace
        </Link>
      </p>
    </form>
  );
}
