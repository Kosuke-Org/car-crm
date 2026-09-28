/**
 * Customers Board Component
 * Kanban view of the customer pipeline with one column per status.
 * Drag a card to another column (or use "Move to" in its menu) to change its status.
 */

'use client';

import { useState } from 'react';

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { inferRouterOutputs } from '@trpc/server';
import { Search } from 'lucide-react';

import type { AppRouter } from '@/lib/trpc/router';
import type { CustomerStatus } from '@/lib/types';

import { useMoveCustomer } from '@/hooks/use-customers';

import { Input } from '@/components/ui/input';

import { statusOptions } from '../utils';
import { CustomerBoardCardPreview } from './customer-board-card';
import { CustomerBoardColumn } from './customer-board-column';

type CustomerListItem = inferRouterOutputs<AppRouter>['customers']['list']['customers'][number];

interface CustomersBoardProps {
  organizationId: string;
  organizationSlug: string;
  // Raw input value (shown in the field) and debounced value (sent to the server)
  searchInput: string;
  searchQuery?: string;
  onSearchChange: (query: string) => void;
  onEdit: (customer: CustomerListItem) => void;
  onDelete: (id: string) => void;
}

export function CustomersBoard({
  organizationId,
  organizationSlug,
  searchInput,
  searchQuery,
  onSearchChange,
  onEdit,
  onDelete,
}: CustomersBoardProps) {
  const [activeCustomer, setActiveCustomer] = useState<CustomerListItem | null>(null);
  const { moveCustomer } = useMoveCustomer({ organizationId, searchQuery });

  // A small movement threshold keeps clicks on links and menus working;
  // the touch delay leaves vertical scrolling to the browser.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const customer = event.active.data.current?.customer as CustomerListItem | undefined;
    setActiveCustomer(customer ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCustomer(null);
    const customer = event.active.data.current?.customer as CustomerListItem | undefined;
    const targetStatus = event.over?.id as CustomerStatus | undefined;
    if (!customer || !targetStatus) return;
    moveCustomer({ customer, status: targetStatus });
  };

  const handleMove = (customer: CustomerListItem, status: CustomerStatus) => {
    moveCustomer({ customer, status });
  };

  return (
    <div className="space-y-4">
      <div className="relative w-full sm:w-[400px] lg:w-[500px]">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search by name, email, phone or model..."
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <DndContext
        id="customers-board"
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveCustomer(null)}
      >
        <div className="flex items-start gap-4 overflow-x-auto pb-2">
          {statusOptions.map((option) => (
            <CustomerBoardColumn
              key={option.value}
              organizationId={organizationId}
              organizationSlug={organizationSlug}
              status={option.value}
              label={option.label}
              searchQuery={searchQuery}
              onEdit={onEdit}
              onDelete={onDelete}
              onMove={handleMove}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeCustomer && <CustomerBoardCardPreview customer={activeCustomer} />}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
