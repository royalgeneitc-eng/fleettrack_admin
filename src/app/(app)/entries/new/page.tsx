'use client';

import { EntryForm } from '@/components/entry-form';
import { PageHeader } from '@/components/ui';

export default function NewEntryPage() {
  return (
    <div>
      <PageHeader title="New daily entry" subtitle="Record one vehicle's collection and expenses for a day" />
      <EntryForm />
    </div>
  );
}
