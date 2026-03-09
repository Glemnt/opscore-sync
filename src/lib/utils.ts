import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function hoursToHM(decimal: number): { h: number; m: number } {
  const h = Math.floor(decimal);
  const m = Math.round((decimal % 1) * 60);
  return { h, m };
}

export function hmToHours(h: number, m: number): number {
  return h + m / 60;
}

export function formatTime(decimal: number | null | undefined): string {
  if (!decimal && decimal !== 0) return '—';
  if (decimal === 0) return '0min';
  const { h, m } = hoursToHM(decimal);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${m}min`;
}
