/**
 * Customer Filters Component
 * Status filter panel with apply button, plus active filter badges
 */

'use client';

import { useEffect, useState } from 'react';

import { ListFilter, X } from 'lucide-react';

import type { CustomerStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { statusColors, statusOptions } from '../utils';

interface CustomerFiltersProps {
  selectedStatuses: CustomerStatus[];
  activeFiltersCount: number;
  onStatusesChange: (statuses: CustomerStatus[]) => void;
}

export function CustomerFilters({
  selectedStatuses,
  activeFiltersCount,
  onStatusesChange,
}: CustomerFiltersProps) {
  const [open, setOpen] = useState(false);
  const [pendingStatuses, setPendingStatuses] = useState<CustomerStatus[]>(selectedStatuses);

  useEffect(() => {
    setPendingStatuses(selectedStatuses);
  }, [selectedStatuses]);

  const handleStatusToggle = (status: CustomerStatus) => {
    if (pendingStatuses.includes(status)) {
      setPendingStatuses(pendingStatuses.filter((s) => s !== status));
    } else {
      setPendingStatuses([...pendingStatuses, status]);
    }
  };

  const handleApply = () => {
    onStatusesChange(pendingStatuses);
    setOpen(false);
  };

  const handleCancel = () => {
    setPendingStatuses(selectedStatuses);
    setOpen(false);
  };

  const hasPendingChanges =
    JSON.stringify([...pendingStatuses].sort()) !== JSON.stringify([...selectedStatuses].sort());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2">
          <ListFilter />
          Filters
          {activeFiltersCount > 0 && (
            <Badge className="h-5 w-5 p-0 text-xs">{activeFiltersCount}</Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start" side="bottom" sideOffset={4}>
        <div className="space-y-3 p-4">
          <Label className="text-sm font-medium">Status</Label>
          <div className="space-y-2">
            {statusOptions.map((option) => (
              <div key={option.value} className="flex items-center gap-2">
                <Checkbox
                  id={`status-${option.value}`}
                  checked={pendingStatuses.includes(option.value)}
                  onCheckedChange={() => handleStatusToggle(option.value)}
                />
                <label
                  htmlFor={`status-${option.value}`}
                  className="flex-1 cursor-pointer text-sm leading-none"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-muted/30 flex items-center justify-between border-t px-3 py-2">
          <Button variant="ghost" size="sm" onClick={handleCancel} className="h-8">
            Cancel
          </Button>
          <Button size="sm" onClick={handleApply} disabled={!hasPendingChanges} className="h-8">
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface ActiveFilterBadgesProps {
  selectedStatuses: CustomerStatus[];
  onStatusesChange: (statuses: CustomerStatus[]) => void;
}

export function ActiveFilterBadges({
  selectedStatuses,
  onStatusesChange,
}: ActiveFilterBadgesProps) {
  if (selectedStatuses.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {selectedStatuses.map((status) => (
        <Badge
          key={status}
          variant="outline"
          className={cn('gap-1 pr-1 pl-2', statusColors[status])}
        >
          {status}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onStatusesChange(selectedStatuses.filter((s) => s !== status))}
            className="h-4 w-4 p-0 hover:bg-transparent hover:text-current"
          >
            <X />
          </Button>
        </Badge>
      ))}
    </div>
  );
}
