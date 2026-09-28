/**
 * Customers Table Column Definitions
 * Defines columns for the customers data table with server-side sorting
 */

'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { inferRouterOutputs } from '@trpc/server';
import { Edit, Eye, MoreHorizontal, Trash } from 'lucide-react';

import type { AppRouter } from '@/lib/trpc/router';

import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { getDaysSinceLastContact, getLastContactTone, statusColors } from '../utils';

type RouterOutput = inferRouterOutputs<AppRouter>;
type CustomerWithDetails = RouterOutput['customers']['list']['customers'][number];

export type CustomerSortColumn = 'createdAt' | 'lastName' | 'lastContactedAt';

interface ColumnActionsProps {
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

interface ColumnSortingProps {
  sortBy: CustomerSortColumn;
  sortOrder: 'asc' | 'desc';
  onSort: (column: CustomerSortColumn) => void;
}

interface ColumnSelectionProps {
  enableRowSelection?: boolean;
}

export function getCustomerColumns(
  actions: ColumnActionsProps,
  sorting: ColumnSortingProps,
  selection?: ColumnSelectionProps
): ColumnDef<CustomerWithDetails>[] {
  const { onView, onEdit, onDelete } = actions;
  const { sortBy, sortOrder, onSort } = sorting;
  const { enableRowSelection = true } = selection || {};

  const formatDate = (date: Date | null) => {
    if (!date) return '—';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

  const columns: ColumnDef<CustomerWithDetails>[] = [];

  if (enableRowSelection) {
    columns.push({
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsSomeRowsSelected() ? 'indeterminate' : table.getIsAllRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onCheckedChange={row.getToggleSelectedHandler()}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    });
  }

  columns.push(
    {
      accessorKey: 'lastName',
      header: () => (
        <DataTableColumnHeader
          title="Name"
          sortable
          sortDirection={sortBy === 'lastName' ? sortOrder : false}
          onSort={() => onSort('lastName')}
        />
      ),
      cell: ({ row }) => `${row.original.firstName} ${row.original.lastName}`,
    },
    {
      accessorKey: 'email',
      header: () => <DataTableColumnHeader title="Email" />,
      cell: ({ row }) => row.original.email,
    },
    {
      accessorKey: 'phone',
      header: () => <DataTableColumnHeader title="Phone" />,
      cell: ({ row }) => row.original.phone || '—',
    },
    {
      accessorKey: 'status',
      header: () => <DataTableColumnHeader title="Status" />,
      cell: ({ row }) => (
        <Badge className={statusColors[row.original.status]}>{row.original.status}</Badge>
      ),
    },
    {
      accessorKey: 'interestedInModel',
      header: () => <DataTableColumnHeader title="Interested in" />,
      cell: ({ row }) => row.original.interestedInModel || '—',
    },
    {
      accessorKey: 'lastContactedAt',
      header: () => (
        <DataTableColumnHeader
          title="Last contacted"
          sortable
          sortDirection={sortBy === 'lastContactedAt' ? sortOrder : false}
          onSort={() => onSort('lastContactedAt')}
        />
      ),
      cell: ({ row }) => {
        const lastContactedAt = row.original.lastContactedAt;
        const days = getDaysSinceLastContact(lastContactedAt);
        const tone = getLastContactTone(days);

        return (
          <div className="flex items-center gap-2">
            {lastContactedAt && <span>{formatDate(lastContactedAt)}</span>}
            <Badge
              variant={
                tone === 'destructive'
                  ? 'destructive'
                  : tone === 'warning'
                    ? 'outline'
                    : 'secondary'
              }
              className={
                tone === 'warning'
                  ? 'border-brand-accent bg-brand-accent/20 text-foreground'
                  : undefined
              }
            >
              {days === null ? 'Never' : `${days} ${days === 1 ? 'day' : 'days'}`}
            </Badge>
          </div>
        );
      },
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const customer = row.original;

        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(customer.id);
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(customer.id);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(customer.id);
                  }}
                  className="text-destructive"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    }
  );

  return columns;
}
