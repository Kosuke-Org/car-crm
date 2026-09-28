/**
 * Customer Board Column
 * One status lane of the board: loads its own customers page by page and accepts dropped cards
 */

'use client';

import { useDroppable } from '@dnd-kit/core';
import type { inferRouterOutputs } from '@trpc/server';
import { Loader2 } from 'lucide-react';

import type { AppRouter } from '@/lib/trpc/router';
import type { CustomerStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

import { useCustomerBoardColumn } from '@/hooks/use-customers';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { statusColors } from '../utils';
import { CustomerBoardCard } from './customer-board-card';

type CustomerListItem = inferRouterOutputs<AppRouter>['customers']['list']['customers'][number];

export function CustomerBoardColumnSkeleton() {
  return (
    <div className="bg-muted/40 flex min-w-72 flex-1 flex-col gap-3 rounded-lg border p-3">
      <Skeleton className="h-6 w-24" />
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  );
}

interface CustomerBoardColumnProps {
  organizationId: string;
  organizationSlug: string;
  status: CustomerStatus;
  label: string;
  searchQuery?: string;
  onEdit: (customer: CustomerListItem) => void;
  onDelete: (id: string) => void;
  onMove: (customer: CustomerListItem, status: CustomerStatus) => void;
}

export function CustomerBoardColumn({
  organizationId,
  organizationSlug,
  status,
  label,
  searchQuery,
  onEdit,
  onDelete,
  onMove,
}: CustomerBoardColumnProps) {
  const { customers, total, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useCustomerBoardColumn({ organizationId, status, searchQuery });

  const { setNodeRef, isOver } = useDroppable({ id: status });

  if (isLoading) {
    return <CustomerBoardColumnSkeleton />;
  }

  return (
    <section
      ref={setNodeRef}
      aria-label={`${label} customers`}
      className={cn(
        'bg-muted/40 flex min-w-72 flex-1 flex-col gap-3 rounded-lg border p-3 transition-colors',
        isOver && 'border-primary bg-muted'
      )}
    >
      <div className="flex items-center gap-2">
        <Badge className={statusColors[status]}>{label}</Badge>
        <span className="text-muted-foreground text-sm tabular-nums">{total}</span>
      </div>

      {customers.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          {searchQuery ? 'No matching customers' : 'No customers'}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {customers.map((customer) => (
            <CustomerBoardCard
              key={customer.id}
              customer={customer}
              customerHref={`/org/${organizationSlug}/customers/${customer.id}`}
              onEdit={onEdit}
              onDelete={onDelete}
              onMove={onMove}
            />
          ))}
        </div>
      )}

      {hasNextPage && (
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchNextPage}
          disabled={isFetchingNextPage}
          className="text-muted-foreground"
        >
          {isFetchingNextPage && <Loader2 className="animate-spin" />}
          {isFetchingNextPage ? 'Loading...' : `Show more (${total - customers.length})`}
        </Button>
      )}
    </section>
  );
}
