import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  // Gregorian, Arabic locale, Latin numerals (matches tender paperwork).
  return d.toLocaleDateString("ar-AE-u-nu-latn", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
