export type Role = 'owner' | 'manager' | 'recorder';
export type CategoryKind = 'daily' | 'fixed';
export type CategoryTag = 'driver' | 'wages' | 'tithe' | null;

export interface Organization {
  id: string;
  name: string;
  slug: string;
  currency: string;
  status: 'active' | 'suspended';
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
  tagline: string | null;
}

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: Role;
  isSuperAdmin: boolean;
  organizationId: string | null;
  organization: Organization | null;
}

export interface Vehicle {
  id: string;
  registration: string;
  nickname: string | null;
  makeModel: string | null;
  capacity: number | null;
  sacco: string | null;
  route: string | null;
  status: 'active' | 'inactive';
  notes: string | null;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  kind: CategoryKind;
  tag: CategoryTag;
  sortOrder: number;
  active: boolean;
}

export interface EntryExpense {
  categoryId: string;
  categoryName: string;
  amount: number;
}

export interface DailyEntry {
  id: string;
  vehicleId: string;
  vehicleRegistration: string;
  entryDate: string; // YYYY-MM-DD
  income: number;
  parcels: number;
  notes: string | null;
  expenses: EntryExpense[];
  totalExpenses: number;
  net: number;
  recordedBy: string | null;
  recordedByName: string | null;
  updatedAt: string;
}

export interface FixedExpense {
  id: string;
  vehicleId: string | null;
  vehicleRegistration: string | null;
  categoryId: string;
  categoryName: string;
  month: string; // YYYY-MM-01
  amount: number;
  description: string | null;
}
