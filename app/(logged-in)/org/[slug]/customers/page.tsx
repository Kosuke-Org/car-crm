/**
 * Organization Customers Page
 * Dealership customer pipeline as a status board (default) or a table with
 * server-side filtering, search, pagination, and sorting
 */

'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { Kanban, Plus, Table2 } from 'lucide-react';

import type { CustomerStatus, CustomerWithDetails } from '@/lib/types';

import { useCustomerActions, useCustomersList } from '@/hooks/use-customers';
import { useOrganization } from '@/hooks/use-organization';
import { useTableFilters } from '@/hooks/use-table-filters';
import { useTablePagination } from '@/hooks/use-table-pagination';
import { useTableRowSelection } from '@/hooks/use-table-row-selection';
import { useTableSearch } from '@/hooks/use-table-search';
import { useTableSorting } from '@/hooks/use-table-sorting';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

import { CustomerBoardColumnSkeleton } from './components/customer-board-column';
import { CustomerDialog } from './components/customer-dialog';
import { CustomersBoard } from './components/customers-board';
import { CustomersDataTable } from './components/customers-data-table';
import { statusOptions } from './utils';

function CustomersPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-96" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-10 w-full sm:w-[400px] lg:w-[500px]" />
        <div className="flex gap-4 overflow-hidden">
          {statusOptions.map((option) => (
            <CustomerBoardColumnSkeleton key={option.value} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function OrgCustomersPage() {
  const router = useRouter();
  const { organization: activeOrganization, isLoading: isLoadingOrg } = useOrganization();

  const { inputValue, searchValue, setSearchValue } = useTableSearch({
    initialValue: '',
    debounceMs: 300,
  });

  const { sortBy, sortOrder, handleSort } = useTableSorting<
    'createdAt' | 'lastName' | 'lastContactedAt'
  >({
    initialSortBy: 'createdAt',
    initialSortOrder: 'desc',
  });

  const { page, pageSize, setPage, setPageSize, goToFirstPage } = useTablePagination({
    initialPage: 1,
    initialPageSize: 10,
  });

  const { filters, updateFilter, resetFilters } = useTableFilters({
    selectedStatuses: [] as CustomerStatus[],
  });

  const rowSelection = useTableRowSelection();

  const [view, setView] = useState<'board' | 'table'>('board');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithDetails | null>(null);
  const [customerToDeleteId, setCustomerToDeleteId] = useState<string | null>(null);

  const trimmedSearch = searchValue.trim() || undefined;

  const { customers, total, totalPages, isLoading } = useCustomersList(
    {
      organizationId: activeOrganization?.id ?? '',
      statuses: filters.selectedStatuses.length > 0 ? filters.selectedStatuses : undefined,
      searchQuery: trimmedSearch,
      page,
      limit: pageSize,
      sortBy,
      sortOrder,
    },
    { enabled: view === 'table' }
  );

  const {
    createCustomer,
    updateCustomer,
    deleteCustomer,
    exportCustomers,
    isCreating,
    isUpdating,
    isDeleting,
    isExporting,
  } = useCustomerActions();

  const handleClearFilters = () => {
    resetFilters();
    goToFirstPage();
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDeleteId || !activeOrganization) return;
    await deleteCustomer({ id: customerToDeleteId, organizationId: activeOrganization.id });
    setDeleteDialogOpen(false);
    setCustomerToDeleteId(null);
  };

  const handleViewClick = (id: string) => {
    if (!activeOrganization) return;
    router.push(`/org/${activeOrganization.slug}/customers/${id}`);
  };

  const handleEditClick = (customer: CustomerWithDetails | undefined) => {
    if (!customer) return;
    setSelectedCustomer(customer);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setCustomerToDeleteId(id);
    setDeleteDialogOpen(true);
  };

  if (isLoadingOrg || !activeOrganization) {
    return <CustomersPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage leads, prospects and buyers for your dealership
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            variant="outline"
            value={view}
            onValueChange={(value) => {
              if (value === 'board' || value === 'table') setView(value);
            }}
            aria-label="Customers view"
          >
            <ToggleGroupItem value="board" aria-label="Board view" className="gap-2 px-3">
              <Kanban />
              Board
            </ToggleGroupItem>
            <ToggleGroupItem value="table" aria-label="Table view" className="gap-2 px-3">
              <Table2 />
              Table
            </ToggleGroupItem>
          </ToggleGroup>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Customer
          </Button>
        </div>
      </div>

      {view === 'board' ? (
        <CustomersBoard
          organizationId={activeOrganization.id}
          organizationSlug={activeOrganization.slug}
          searchInput={inputValue}
          searchQuery={trimmedSearch}
          onSearchChange={setSearchValue}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />
      ) : (
        <CustomersDataTable
          customers={customers}
          total={total}
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
          isLoading={isLoading}
          // Filter props
          searchQuery={inputValue}
          selectedStatuses={filters.selectedStatuses}
          // Sorting props
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSearchChange={setSearchValue}
          onStatusesChange={(statuses) => {
            updateFilter('selectedStatuses', statuses);
            goToFirstPage();
          }}
          onClearFilters={handleClearFilters}
          onSortChange={handleSort}
          // Pagination handlers
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          // Action handlers
          onView={handleViewClick}
          onEdit={(id) => handleEditClick(customers.find((c) => c.id === id))}
          onDelete={handleDeleteClick}
          // Export handler
          onExport={(type) => {
            exportCustomers({ type, organizationId: activeOrganization.id });
          }}
          isExporting={isExporting}
          selectedRowIds={rowSelection.selectedRowIds}
          onRowSelectionChange={rowSelection.setSelectedRowIds}
          onBulkDelete={async (ids) => {
            for (const id of ids) {
              await deleteCustomer({ id, organizationId: activeOrganization.id });
            }
            rowSelection.clearSelection();
          }}
        />
      )}

      {/* Create Customer Dialog */}
      <CustomerDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={async (values) => {
          await createCustomer({
            ...values,
            organizationId: activeOrganization.id,
          });
        }}
        mode="create"
        isSubmitting={isCreating}
      />

      {/* Edit Customer Dialog */}
      <CustomerDialog
        key={selectedCustomer?.id}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSubmit={async (values) => {
          if (!selectedCustomer) return;

          await updateCustomer({
            id: selectedCustomer.id,
            organizationId: activeOrganization.id,
            ...values,
          });
        }}
        initialValues={
          selectedCustomer
            ? {
                firstName: selectedCustomer.firstName,
                lastName: selectedCustomer.lastName,
                email: selectedCustomer.email,
                phone: selectedCustomer.phone ?? undefined,
                city: selectedCustomer.city ?? undefined,
                status: selectedCustomer.status,
                interestedInModel: selectedCustomer.interestedInModel ?? undefined,
                lastContactedAt: selectedCustomer.lastContactedAt ?? undefined,
                notes: selectedCustomer.notes ?? undefined,
              }
            : undefined
        }
        mode="edit"
        isSubmitting={isUpdating}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this customer. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCustomer} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
