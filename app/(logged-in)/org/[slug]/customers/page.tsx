/**
 * Organization Customers Page
 * Dealership customer pipeline as a kanban board grouped by status
 */

'use client';

import { useState } from 'react';

import { Download, Loader2, Plus, Search } from 'lucide-react';

import { exportTypeEnum } from '@/lib/trpc/schemas/customers';
import { cn } from '@/lib/utils';

import { useCustomerActions } from '@/hooks/use-customers';
import { useOrganization } from '@/hooks/use-organization';
import { useTableSearch } from '@/hooks/use-table-search';

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
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';

import type { BoardCustomer } from './components/customer-card';
import { CustomerDialog } from './components/customer-dialog';
import { CustomersBoard } from './components/customers-board';

function CustomersPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-96" />
      </div>
      <Skeleton className="h-10 w-full max-w-lg" />
      <div className="flex gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[400px] w-72 shrink-0" />
        ))}
      </div>
    </div>
  );
}

export default function OrgCustomersPage() {
  const { organization: activeOrganization, isLoading: isLoadingOrg } = useOrganization();

  const { inputValue, searchValue, setSearchValue } = useTableSearch({
    initialValue: '',
    debounceMs: 300,
  });

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<BoardCustomer | null>(null);

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

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer || !activeOrganization) return;
    await deleteCustomer({ id: selectedCustomer.id, organizationId: activeOrganization.id });
    setDeleteDialogOpen(false);
    setSelectedCustomer(null);
  };

  const handleEditClick = (customer: BoardCustomer) => {
    setSelectedCustomer(customer);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (customer: BoardCustomer) => {
    setSelectedCustomer(customer);
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
            Manage leads, prospects and buyers for your dealership. Drag a card to change its
            status.
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Customer
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative w-full sm:w-[400px] lg:w-[500px]">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search by name, email, phone or model..."
            value={inputValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9"
          />
        </div>
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
                  onClick={() => exportCustomers({ type, organizationId: activeOrganization.id })}
                  disabled={isExporting}
                >
                  {type.toUpperCase()}
                </Button>
              ))}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Kanban Board */}
      <CustomersBoard
        organizationId={activeOrganization.id}
        organizationSlug={activeOrganization.slug}
        searchQuery={searchValue.trim() || undefined}
        onStatusChange={({ customer, status }) =>
          updateCustomer({ id: customer.id, organizationId: activeOrganization.id, status })
        }
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
      />

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
