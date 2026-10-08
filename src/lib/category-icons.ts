import {
  Banknote, CarFront, Droplets, Fuel, Handshake, HeartHandshake, Hammer, IdCard, Milestone, MoreHorizontal,
  CircleParking, ShieldCheck, Siren, Ticket, User, Users, Warehouse, Wrench, type LucideIcon,
} from 'lucide-react';

/** Icon + tint for an expense category, matched on its name — mirrors the Android app's categoryVisual(). */
export function categoryVisual(name: string): { icon: LucideIcon; color: string } {
  const n = name.toLowerCase();
  if (n.includes('sacco')) return { icon: Handshake, color: '#0b5cff' };
  if (n.includes('fuel')) return { icon: Fuel, color: '#ea580c' };
  if (n.includes('driver')) return { icon: User, color: '#7c3aed' };
  if (n.includes('gate')) return { icon: Milestone, color: '#0891b2' };
  if (n.includes('expw') || n.includes('express')) return { icon: CarFront, color: '#4f46e5' };
  if (n.includes('wash')) return { icon: Droplets, color: '#0ea5e9' };
  if (n.includes('police')) return { icon: Siren, color: '#3b5bdb' };
  if (n.includes('stage')) return { icon: Ticket, color: '#db2777' };
  if (n.includes('insurance')) return { icon: ShieldCheck, color: '#0b5cff' };
  if (n.includes('wage')) return { icon: Users, color: '#7c3aed' };
  if (n.includes('tithe')) return { icon: HeartHandshake, color: '#16a34a' };
  if (n.includes('parking')) return { icon: CircleParking, color: '#0891b2' };
  if (n.includes('repair')) return { icon: Hammer, color: '#ea580c' };
  if (n.includes('service')) return { icon: Wrench, color: '#d97706' };
  if (n.includes('licen')) return { icon: IdCard, color: '#4f46e5' };
  if (n.includes('rent') || n.includes('garage')) return { icon: Warehouse, color: '#64748b' };
  if (n.includes('other')) return { icon: MoreHorizontal, color: '#64748b' };
  return { icon: Banknote, color: '#64748b' };
}
