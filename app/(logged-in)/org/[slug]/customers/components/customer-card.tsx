/**
 * Customer Card
 * Draggable kanban card showing a customer's key details
 */

'use client';

import Link from 'next/link';

import { useDraggable } from '@dnd-kit/core';
import type { inferRouterOutputs } from '@trpc/server';
import { format } from 'date-fns';
import { Edit, Eye, MoreHorizontal, Trash } from 'lucide-react';

import type { AppRouter } from '@/lib/trpc/router';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type BoardCustomer = inferRouterOutputs<AppRouter>['customers']['list']['customers'][number];

interface CustomerCardContentProps {
  customer: BoardCustomer;
  href: string;
  onEdit?: (customer: BoardCustomer) => void;
  onDelete?: (customer: BoardCustomer) => void;
}

function CustomerCardContent({ customer, href, onEdit, onDelete }: CustomerCardContentProps) {
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            href={href}
            className="block truncate text-sm font-medium hover:underline"
            draggable={false}
          >
            {customer.firstName} {customer.lastName}
          </Link>
          <p className="text-muted-foreground truncate text-xs">{customer.email}</p>
        </div>
        {onEdit && onDelete && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="-mt-1 -mr-1 h-7 w-7 shrink-0"
                onPointerDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={href}>
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(customer)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(customer)} className="text-destructive">
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {customer.interestedInModel && (
        <p className="mt-2 truncate text-xs">
          <span className="text-muted-foreground">Interested in </span>
          {customer.interestedInModel}
        </p>
      )}
      <div className="text-muted-foreground mt-2 flex items-center justify-between gap-2 text-xs">
        <span className="truncate">{customer.city || customer.phone || ''}</span>
        <span className="shrink-0">
          {customer.lastContactedAt
            ? `Contacted ${format(new Date(customer.lastContactedAt), 'MMM d')}`
            : 'Not contacted'}
        </span>
      </div>
    </>
  );
}

interface CustomerCardProps extends CustomerCardContentProps {
  isPending?: boolean;
}

export function CustomerCard({ customer, href, onEdit, onDelete, isPending }: CustomerCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: customer.id,
    data: { customer },
    disabled: isPending,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      aria-roledescription="Draggable customer card"
      className={cn(
        'bg-card cursor-grab touch-none rounded-md border p-3 shadow-xs transition-opacity select-none active:cursor-grabbing',
        isDragging && 'opacity-40',
        isPending && 'cursor-progress opacity-60'
      )}
    >
      <CustomerCardContent customer={customer} href={href} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

/** Static copy of a card rendered inside the DragOverlay while dragging */
export function CustomerCardOverlay({ customer, href }: { customer: BoardCustomer; href: string }) {
  return (
    <div className="bg-card cursor-grabbing rounded-md border p-3 shadow-lg">
      <CustomerCardContent customer={customer} href={href} />
    </div>
  );
}
