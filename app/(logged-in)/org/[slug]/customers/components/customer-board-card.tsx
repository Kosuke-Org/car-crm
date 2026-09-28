/**
 * Customer Board Card
 * A draggable customer card for the status board, with view/edit/move/delete actions
 */

'use client';

import Link from 'next/link';

import { useDraggable } from '@dnd-kit/core';
import { format } from 'date-fns';
import {
  ArrowRightLeft,
  CalendarClock,
  CarFront,
  Edit,
  Eye,
  MoreHorizontal,
  Trash,
} from 'lucide-react';

import type { CustomerStatus, CustomerWithDetails } from '@/lib/types';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { statusOptions } from '../utils';

interface CustomerCardDetailsProps {
  customer: CustomerWithDetails;
}

function CustomerCardDetails({ customer }: CustomerCardDetailsProps) {
  return (
    <div className="text-muted-foreground space-y-1 text-xs">
      <p className="truncate">{customer.email}</p>
      {customer.interestedInModel && (
        <p className="flex items-center gap-1.5">
          <CarFront className="size-3.5 shrink-0" />
          <span className="truncate">{customer.interestedInModel}</span>
        </p>
      )}
      <p className="flex items-center gap-1.5">
        <CalendarClock className="size-3.5 shrink-0" />
        {customer.lastContactedAt
          ? `Contacted ${format(new Date(customer.lastContactedAt), 'MMM d, yyyy')}`
          : 'Not contacted yet'}
      </p>
    </div>
  );
}

interface CustomerBoardCardPreviewProps {
  customer: CustomerWithDetails;
}

/**
 * Static copy of a card, rendered under the pointer while dragging
 */
export function CustomerBoardCardPreview({ customer }: CustomerBoardCardPreviewProps) {
  return (
    <Card className="w-72 cursor-grabbing gap-2 px-3 py-3 shadow-lg">
      <p className="truncate text-sm font-medium">
        {customer.firstName} {customer.lastName}
      </p>
      <CustomerCardDetails customer={customer} />
    </Card>
  );
}

interface CustomerBoardCardProps {
  customer: CustomerWithDetails;
  customerHref: string;
  onEdit: (customer: CustomerWithDetails) => void;
  onDelete: (id: string) => void;
  onMove: (move: { customer: CustomerWithDetails; status: CustomerStatus }) => void;
  // True while this customer's previous move is still saving
  isMoving: boolean;
}

export function CustomerBoardCard({
  customer,
  customerHref,
  onEdit,
  onDelete,
  onMove,
  isMoving,
}: CustomerBoardCardProps) {
  const { setNodeRef, listeners, isDragging } = useDraggable({
    id: customer.id,
    data: { customer },
    disabled: isMoving,
  });

  return (
    <Card
      ref={setNodeRef}
      {...listeners}
      className={cn(
        'touch-manipulation gap-2 px-3 py-3 select-none',
        isMoving ? 'cursor-progress' : 'cursor-grab',
        isDragging && 'opacity-40'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={customerHref}
          draggable={false}
          className="truncate text-sm font-medium hover:underline"
        >
          {customer.firstName} {customer.lastName}
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="-mt-1 -mr-1 size-7 shrink-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={customerHref}>
                <Eye className="mr-2 size-4" />
                View
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(customer)}>
              <Edit className="mr-2 size-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger
                disabled={isMoving}
                className="data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              >
                <ArrowRightLeft className="text-muted-foreground mr-2 size-4" />
                Move to
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {statusOptions
                  .filter((option) => option.value !== customer.status)
                  .map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => onMove({ customer, status: option.value })}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem onClick={() => onDelete(customer.id)} className="text-destructive">
              <Trash className="mr-2 size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <CustomerCardDetails customer={customer} />
    </Card>
  );
}
