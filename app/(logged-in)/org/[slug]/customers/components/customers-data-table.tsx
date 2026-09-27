/**
 * Customers DataTable Component
 * TanStack Table implementation with server-side pagination, sorting, and filtering
 */

'use client';

import { useCallback, useMemo } from 'react';

import {
  RowSelectionState,
  Updater,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type { inferRouterOutputs } from '@trpc/server';
import { Download, Loader2, Search, Trash2, X } from 'lucide-react';

import type { AppRouter } from '@/lib/trpc/router';
import { type ExportType, exportTypeEnum } from '@/lib/trpc/schemas/customers';
import type { CustomerStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { TableSkeleton } from '@/components/data-table/data-table-skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { ActiveFilterBadges, CustomerFilters } from './customer-filters';
import { type CustomerSortColumn, getCustomerColumns } from './customers-columns';

type RouterOutput = inferRouterOutputs<AppRouter>;
type CustomerWithDetails = RouterOutput['customers']['list']['customers'][number];

interface CustomersDataTableProps {
  customers: CustomerWithDetails[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  // Filter props
  searchQuery: string;
  selectedStatuses: CustomerStatus[];
  // Sorting props
  sortBy: CustomerSortColumn;
  sortOrder: 'asc' | 'desc';
  onSearchChange: (query: string) => void;
  onStatusesChange: (statuses: CustomerStatus[]) => void;
  onClearFilters: () => void;
  onSortChange: (column: CustomerSortColumn) => void;
  // Pagination handlers
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  // Action handlers
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  // Export handler
  onExport: (type: ExportType) => void;
  isExporting: boolean;
  // Row selection props
  selectedRowIds?: string[];
  onRowSelectionChange?: (selectedRowIds: string[]) => void;
  onBulkDelete?: (selectedRowIds: string[]) => void;
}

export function CustomersDataTable({
  customers,
  total,
  page,
  pageSize,
  totalPages,
  isLoading,
  searchQuery,
  selectedStatuses,
  sortBy,
  sortOrder,
  onSearchChange,
  onStatusesChange,
  onClearFilters,
  onSortChange,
  onPageChange,
  onPageSizeChange,
  onView,
  onEdit,
  onDelete,
  onExport,
  isExporting,
  selectedRowIds = [],
  onRowSelectionChange,
  onBulkDelete,
}: CustomersDataTableProps) {
  const rowSelection = useMemo(() => {
    const newRowSelection: Record<string, boolean> = {};
    selectedRowIds.forEach((id) => {
      newRowSelection[id] = true;
    });
    return newRowSelection;
  }, [selectedRowIds]);

  const handleRowSelectionChange = useCallback(
    (updaterOrValue: Updater<RowSelectionState>) => {
      const newRowSelection =
        typeof updaterOrValue === 'function' ? updaterOrValue(rowSelection) : updaterOrValue;

      const selectedIds = Object.keys(newRowSelection).filter((key) => newRowSelection[key]);
      onRowSelectionChange?.(selectedIds);
    },
    [rowSelection, onRowSelectionChange]
  );

  const columns = useMemo(
    () =>
      getCustomerColumns({ onView, onEdit, onDelete }, { sortBy, sortOrder, onSort: onSortChange }),
    [onView, onEdit, onDelete, sortBy, sortOrder, onSortChange]
  );

  // eslint-disable-next-line
  const table = useReactTable({
    data: customers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: totalPages,
    enableRowSelection: true,
    getRowId: (row) => row.id,
    onRowSelectionChange: handleRowSelectionChange,
    state: {
      pagination: {
        pageIndex: page - 1,
        pageSize,
      },
      rowSelection,
    },
  });

  const activeFiltersCount = selectedStatuses.length;

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const hasSelectedRows = selectedRows.length > 0;

  return (
    <>
      {/* Bulk Actions Bar */}
      {hasSelectedRows && (
        <div className="bg-muted/50 flex items-center gap-2 rounded-md border p-3">
          <span className="text-sm font-medium">
            {selectedRows.length} row{selectedRows.length > 1 ? 's' : ''} selected
          </span>
          <div className="ml-auto flex items-center gap-2">
            {onBulkDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onBulkDelete(selectedRows.map((row) => row.original.id))}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="relative w-full sm:w-[400px] lg:w-[500px]">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search by name, email, phone or model..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <CustomerFilters
          activeFiltersCount={activeFiltersCount}
          selectedStatuses={selectedStatuses}
          onStatusesChange={onStatusesChange}
        />
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <X />
            Clear all
          </Button>
        )}
        <div className="ml-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" disabled={isExporting}>
                <Loader2 className={cn('hidden animate-spin', isExporting && 'block')} />
                <Download className={cn('block', isExporting && 'hidden')} />
                Export
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-30 p-2" align="end">
              {exportTypeEnum.options.map((type) => (
                <Button
                  key={type}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => onExport(type)}
                  disabled={isExporting}
                >
                  {type.toUpperCase()}
                </Button>
              ))}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Active Filters Badges */}
      <ActiveFilterBadges selectedStatuses={selectedStatuses} onStatusesChange={onStatusesChange} />

      {isLoading ? (
        <TableSkeleton />
      ) : (
        <div className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer"
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (
                          target.closest('[role="checkbox"]') ||
                          target.closest('[role="menuitem"]') ||
                          target.closest('button')
                        ) {
                          return;
                        }
                        onView(row.original.id);
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No results.{' '}
                      {searchQuery || activeFiltersCount > 0
                        ? 'Try adjusting your filters'
                        : 'Add your first customer to get started'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {customers.length > 0 && (
            <DataTablePagination
              table={table}
              totalRecords={total}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
            />
          )}
        </div>
      )}
    </>
  );
}
