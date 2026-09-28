/**
 * Customers Board
 * Kanban board grouping customers by status, with drag-and-drop to change status
 */

'use client';

import { useState } from 'react';

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

import type { CustomerStatus } from '@/lib/types';

import { statusOptions } from '../utils';
import { type BoardCustomer, CustomerCardOverlay } from './customer-card';
import { CustomersBoardColumn, type PendingMove } from './customers-board-column';

interface CustomersBoardProps {
  organizationId: string;
  organizationSlug: string;
  searchQuery?: string;
  onStatusChange: (params: { customer: BoardCustomer; status: CustomerStatus }) => Promise<unknown>;
  onEdit: (customer: BoardCustomer) => void;
  onDelete: (customer: BoardCustomer) => void;
}

export function CustomersBoard({
  organizationId,
  organizationSlug,
  searchQuery,
  onStatusChange,
  onEdit,
  onDelete,
}: CustomersBoardProps) {
  const [activeCustomer, setActiveCustomer] = useState<BoardCustomer | null>(null);
  const [pendingMoves, setPendingMoves] = useState<Record<string, PendingMove>>({});

  const sensors = useSensors(
    // Small activation distance keeps clicks on links and menus working
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const customer = event.active.data.current?.customer as BoardCustomer | undefined;
    setActiveCustomer(customer ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveCustomer(null);
    const customer = event.active.data.current?.customer as BoardCustomer | undefined;
    const toStatus = event.over?.id as CustomerStatus | undefined;
    if (!customer || !toStatus || customer.status === toStatus) return;

    setPendingMoves((prev) => ({
      ...prev,
      [customer.id]: { customer: { ...customer, status: toStatus }, toStatus },
    }));

    try {
      await onStatusChange({ customer, status: toStatus });
    } catch {
      // Error toast is shown by the mutation; the card returns to its original column
    } finally {
      setPendingMoves((prev) => {
        const { [customer.id]: _removed, ...rest } = prev;
        return rest;
      });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveCustomer(null)}
    >
      <div className="flex items-start gap-4 overflow-x-auto pb-4">
        {statusOptions.map((option) => (
          <CustomersBoardColumn
            key={option.value}
            status={option.value}
            label={option.label}
            organizationId={organizationId}
            organizationSlug={organizationSlug}
            searchQuery={searchQuery}
            pendingMoves={pendingMoves}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
      <DragOverlay>
        {activeCustomer && (
          <CustomerCardOverlay
            customer={activeCustomer}
            href={`/org/${organizationSlug}/customers/${activeCustomer.id}`}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
