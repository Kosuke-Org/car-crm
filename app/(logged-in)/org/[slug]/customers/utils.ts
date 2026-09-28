/**
 * Customer utilities
 * Shared constants and helper functions for the customers feature
 */
import { differenceInCalendarDays } from 'date-fns';

import type { CustomerStatus } from '@/lib/types';

export const statusOptions: { value: CustomerStatus; label: string }[] = [
  { value: 'lead', label: 'Lead' },
  { value: 'prospect', label: 'Prospect' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export const statusColors: Record<CustomerStatus, string> = {
  lead: 'bg-chart-2/10 text-chart-2 border-chart-2/20',
  prospect: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  active: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  inactive:
    'bg-chart-1/10 text-chart-1 border-chart-1/20 dark:bg-chart-5/10 dark:text-chart-5 dark:border-chart-5/20',
};

export function getDaysSinceLastContact(lastContactedAt: Date | null, now = new Date()) {
  if (!lastContactedAt) return null;
  return Math.max(0, differenceInCalendarDays(now, lastContactedAt));
}

export function getLastContactTone(days: number | null) {
  if (days === null || days < 14) return 'neutral';
  if (days < 30) return 'warning';
  return 'destructive';
}
