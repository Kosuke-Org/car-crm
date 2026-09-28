/**
 * Customers Board Column
 * Droppable kanban column listing the customers of a single status
 */

'use client';

import { useDroppable } from '@dnd-kit/core';
import { Loader2 } from 'lucide-react';

import type { CustomerStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

import { useCustomersBoardColumn } from '@/hooks/use-customers';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { statusColors } from '../utils';
import { type BoardCustomer, CustomerCard } from './customer-card';

export interface PendingMove {
  customer: BoardCustomer;
  toStatus: CustomerStatus;
}

interface CustomersBoardColumnProps {
  status: CustomerStatus;
  label: string;
  organizationId: string;
  organizationSlug: string;
  searchQuery?: string;
  pendingMoves: Record<string, PendingMove>;
  onEdit: (customer: BoardCustomer) => void;
  onDelete: (customer: BoardCustomer) => void;
}

function ColumnSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

export function CustomersBoardColumn({
  status,
  label,
  organizationId,
  organizationSlug,
  searchQuery,
  pendingMoves,
  onEdit,
  onDelete,
}: CustomersBoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const { customers, total, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useCustomersBoardColumn({ organizationId, status, searchQuery });

  // Apply in-flight drag moves so cards switch columns immediately
  const movedIn = Object.values(pendingMoves)
    .filter((move) => move.toStatus === status && !customers.some((c) => c.id === move.customer.id))
    .map((move) => move.customer);
  const remaining = customers.filter((c) => {
    const move = pendingMoves[c.id];
    return !move || move.toStatus === status;
  });
  const visibleCustomers = [...movedIn, ...remaining];
  const displayTotal = total - (customers.length - remaining.length) + movedIn.length;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'bg-muted/40 flex w-72 shrink-0 flex-col rounded-lg border p-2 transition-colors',
        isOver && 'bg-muted border-primary/40'
      )}
    >
      <div className="flex items-center justify-between px-1 pt-1 pb-3">
        <Badge variant="outline" className={statusColors[status]}>
          {label}
        </Badge>
        <span className="text-muted-foreground text-xs font-medium">{displayTotal}</span>
      </div>

      {isLoading ? (
        <ColumnSkeleton />
      ) : (
        <div className="flex flex-1 flex-col gap-2">
          {visibleCustomers.length === 0 ? (
            <p className="text-muted-foreground px-1 py-6 text-center text-xs">
              {searchQuery ? 'No matching customers' : 'No customers'}
            </p>
          ) : (
            visibleCustomers.map((customer) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                href={`/org/${organizationSlug}/customers/${customer.id}`}
                onEdit={onEdit}
                onDelete={onDelete}
                isPending={!!pendingMoves[customer.id]}
              />
            ))
          )}
          {hasNextPage && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage && <Loader2 className="animate-spin" />}
              {isFetchingNextPage ? 'Loading...' : 'Load more'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
