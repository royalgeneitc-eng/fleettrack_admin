'use client';

import { useIsDark } from '@/components/theme';

// Same validated palettes as the Android app (ChartColors):
// light #0B5CFF / #C026D3 vs #FFFFFF, dark #4D8BFF / #C026D3 vs #131C31 — both in
// the CVD warn band, so two-series charts always carry a legend and tooltips.
// Categorical slots: the reference palette's light and dark steps, fixed order.
export const LIGHT_CHART = {
  income: '#0b5cff',
  expenses: '#c026d3',
  net: '#16a34a',
  negative: '#dc2626',
  parcels: '#7c3aed',
  grid: '#e5eaf2',
  axis: '#64748b',
  cursor: '#f1f5f9',
  surface: '#ffffff',
  text: '#14213d',
  categorical: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'],
  other: '#94a3b8',
};
const DARK: typeof LIGHT_CHART = {
  income: '#4d8bff',
  expenses: '#c026d3',
  net: '#34d399',
  negative: '#f87171',
  parcels: '#9f7aea',
  grid: '#25324d',
  axis: '#9aa8c0',
  cursor: '#1a2540',
  surface: '#131c31',
  text: '#e6ecf8',
  categorical: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'],
  other: '#64748b',
};

export type ChartPalette = typeof LIGHT_CHART;

export function useChartColors(): ChartPalette {
  return useIsDark() ? DARK : LIGHT_CHART;
}
