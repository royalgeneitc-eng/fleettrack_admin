import { z } from 'zod';
import { isValidDate } from './dates';

export const dateStr = z.string().refine(isValidDate, 'must be a date YYYY-MM-DD');
const money = z.coerce.number().min(0).max(100_000_000);
const optText = z.string().trim().max(500).nullish().transform((v) => (v ? v : null));

export const signupSchema = z.object({
  organizationName: z.string().trim().min(2).max(120),
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  phone: optText,
  password: z.string().min(8).max(200),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const vehicleSchema = z.object({
  registration: z.string().trim().min(2).max(20).transform((s) => s.toUpperCase().replace(/\s+/g, ' ')),
  nickname: optText,
  makeModel: optText,
  capacity: z.coerce.number().int().min(1).max(200).nullish(),
  sacco: optText,
  route: optText,
  status: z.enum(['active', 'inactive']).default('active'),
  notes: optText,
});

export const categorySchema = z.object({
  name: z.string().trim().min(1).max(60),
  kind: z.enum(['daily', 'fixed']),
  tag: z.enum(['driver', 'wages', 'tithe']).nullish().transform((v) => v ?? null),
  sortOrder: z.coerce.number().int().default(0),
  active: z.boolean().default(true),
});

export const entrySchema = z.object({
  id: z.string().uuid().optional(),
  vehicleId: z.string().uuid(),
  entryDate: dateStr,
  income: money,
  parcels: money.default(0),
  notes: optText,
  expenses: z.array(z.object({ categoryId: z.string().uuid(), amount: money })).max(50).default([]),
});

export const fixedExpenseSchema = z.object({
  vehicleId: z.string().uuid().nullish().transform((v) => v ?? null),
  categoryId: z.string().uuid(),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'must be YYYY-MM').transform((m) => `${m}-01`),
  amount: money,
  description: optText,
});

export const userSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  phone: optText,
  role: z.enum(['owner', 'manager', 'recorder']),
  password: z.string().min(8).max(200).optional(),
  active: z.boolean().default(true),
  vehicleIds: z.array(z.string().uuid()).default([]),
});

export const orgSchema = z.object({
  name: z.string().trim().min(2).max(120),
  currency: z.string().trim().toUpperCase().length(3),
  phone: optText,
  email: z.string().trim().email().nullish().or(z.literal('')).transform((v) => v || null),
  // An uploaded logo (small image data URL, resized in the browser) or an https link.
  logoUrl: z
    .union([
      z.string().trim().regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/, 'logo must be a PNG, JPEG or WebP image').max(400_000, 'logo image is too large'),
      z.string().trim().url().regex(/^https?:\/\//i, 'logo link must start with https://'),
    ])
    .nullish()
    .or(z.literal(''))
    .transform((v) => v || null),
  tagline: optText,
});

export const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(200),
});
