'use client';

import clsx from 'clsx';
import { Copy, Printer, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ClosingReport } from '@/components/closing-report';
import { VehicleSelect, currentMonth, monthRange, useVehicles } from '@/components/filters';
import { useSession } from '@/components/session-context';
import { Loading, PageHeader } from '@/components/ui';
import { api, errMsg } from '@/lib/client';
import type { Report } from '@/lib/reports';

type TextType = 'daily' | 'weekly' | 'parcels' | 'monthly';

export default function ReportsPage() {
  const user = useSession();
  const vehicles = useVehicles();
  const [tab, setTab] = useState<'closing' | 'text'>('closing');
  const [vehicleId, setVehicleId] = useState('');
  const vehicle = vehicles.find((v) => v.id === vehicleId);
  const label = vehicle ? vehicle.nickname || vehicle.registration : 'Fleet';

  return (
    <div>
      <PageHeader
        className="no-print"
        title="Reports"
        subtitle="Monthly closing report and WhatsApp-ready summaries"
        actions={<VehicleSelect vehicles={vehicles} value={vehicleId} onChange={setVehicleId} allLabel="Whole fleet" />}
      >
        <div className="inline-flex rounded-lg border border-slate-200 bg-surface p-1">
          {(
            [
              ['closing', 'Monthly closing report'],
              ['text', 'WhatsApp text'],
            ] as const
          ).map(([k, l]) => (
            <button key={k} type="button" onClick={() => setTab(k)} className={clsx('rounded-md px-4 py-1.5 text-sm', tab === k ? 'bg-brand-600 text-white' : 'text-slate-600')}>
              {l}
            </button>
          ))}
        </div>
      </PageHeader>
      {tab === 'closing' ? <Closing vehicleId={vehicleId} label={label} org={user.organization!} /> : <TextReport vehicleId={vehicleId} />}
    </div>
  );
}

function Closing({ vehicleId, label, org }: { vehicleId: string; label: string; org: NonNullable<ReturnType<typeof useSession>['organization']> }) {
  const [month, setMonth] = useState(currentMonth());
  const [report, setReport] = useState<Report | null>(null);
  useEffect(() => {
    const { from, to } = monthRange(month);
    setReport(null);
    api<Report>(`/reports/summary?from=${from}&to=${to}${vehicleId ? `&vehicleId=${vehicleId}` : ''}`).then(setReport);
  }, [month, vehicleId]);
  return (
    <div>
      <div className="no-print mb-4 flex flex-wrap gap-2">
        <input type="month" className="input w-auto" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} aria-label="Month" />
        <button type="button" className="btn-secondary" onClick={() => window.print()}>
          <Printer size={16} /> Print / save as PDF
        </button>
      </div>
      {report ? <ClosingReport report={report} org={org} label={label} month={month} /> : <Loading />}
    </div>
  );
}

function TextReport({ vehicleId }: { vehicleId: string }) {
  const [type, setType] = useState<TextType>('daily');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    api<{ text: string }>(`/reports/text?type=${type}&date=${date}${vehicleId ? `&vehicleId=${vehicleId}` : ''}`)
      .then((r) => setText(r.text))
      .catch((e) => setError(errMsg(e)));
  }, [type, date, vehicleId]);

  async function copy() {
    await navigator.clipboard.writeText(text);
    toast.success('Copied — paste it into WhatsApp');
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="card space-y-4 p-5">
        <div>
          <span className="label">Report</span>
          <div className="grid grid-cols-2 gap-2">
            {(['daily', 'weekly', 'parcels', 'monthly'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={clsx('rounded-lg border px-3 py-2 text-sm capitalize', type === t ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-200')}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <label className="block">
          <span className="label">{type === 'daily' ? 'Day' : type === 'monthly' ? 'Any day in the month' : 'Any day in the week'}</span>
          <input type="date" className="input" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </label>
        <div className="flex gap-2">
          <button type="button" className="btn-primary flex-1" onClick={copy} disabled={!text}>
            <Copy size={16} /> Copy
          </button>
          <a className="btn-secondary flex-1" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer">
            <Share2 size={16} /> WhatsApp
          </a>
        </div>
      </div>
      <div className="lg:col-span-2">
        {error ? (
          <div className="card p-5 text-sm text-red-600">{error}</div>
        ) : (
          <pre className="card min-h-64 whitespace-pre-wrap p-5 font-mono text-sm leading-relaxed">{text || '…'}</pre>
        )}
      </div>
    </div>
  );
}
