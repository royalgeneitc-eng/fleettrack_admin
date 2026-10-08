'use client';

import { use, useEffect, useState } from 'react';
import { EntryForm } from '@/components/entry-form';
import { Loading, PageHeader } from '@/components/ui';
import { api, errMsg } from '@/lib/client';
import type { DailyEntry } from '@/lib/types';

export default function EditEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [entry, setEntry] = useState<DailyEntry | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api<DailyEntry>(`/entries/${id}`).then(setEntry).catch((e) => setError(errMsg(e)));
  }, [id]);
  return (
    <div>
      <PageHeader title="Edit entry" subtitle={entry ? `${entry.vehicleRegistration} · ${entry.entryDate}` : undefined} />
      {error ? <div className="card p-6 text-sm text-red-600">{error}</div> : entry ? <EntryForm entry={entry} /> : <Loading />}
    </div>
  );
}
