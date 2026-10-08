'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/client';
import type { Vehicle } from '@/lib/types';

export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  useEffect(() => {
    api<Vehicle[]>('/vehicles').then(setVehicles).catch(() => {});
  }, []);
  return vehicles;
}

export function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function monthRange(month: string) {
  const [y, m] = month.split('-').map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, '0')}` };
}

export function VehicleSelect({ vehicles, value, onChange, allLabel = 'All vehicles' }: { vehicles: Vehicle[]; value: string; onChange: (v: string) => void; allLabel?: string }) {
  return (
    <select className="input w-auto min-w-40" value={value} onChange={(e) => onChange(e.target.value)} aria-label="Vehicle">
      <option value="">{allLabel}</option>
      {vehicles.map((v) => (
        <option key={v.id} value={v.id}>
          {v.registration}
          {v.nickname ? ` · ${v.nickname}` : ''}
        </option>
      ))}
    </select>
  );
}
