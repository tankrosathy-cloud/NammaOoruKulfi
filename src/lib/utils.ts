import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Robustly checks if a date string falls within the target month.
 * Handles YYYY-MM-DD prefix comparisons first (timezone-immune),
 * then falls back to ISO interval parsing for timestamps.
 */
export function isDateInMonth(dateStr: string | undefined | null, targetDate: Date): boolean {
  if (!dateStr) return false;
  const cleanStr = String(dateStr).trim();
  const targetYearMonth = format(targetDate, 'yyyy-MM');
  
  // 1. Direct string prefix match (e.g. "2026-08-21" starts with "2026-08")
  if (cleanStr.startsWith(targetYearMonth)) {
    return true;
  }
  
  // 2. Interval fallback for full ISO strings with timezone offsets
  try {
    const d = parseISO(cleanStr);
    if (!isNaN(d.getTime())) {
      const start = startOfMonth(targetDate);
      const end = endOfMonth(targetDate);
      return isWithinInterval(d, { start, end });
    }
  } catch {}
  
  return false;
}
