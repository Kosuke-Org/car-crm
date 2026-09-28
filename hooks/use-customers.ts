/**
 * Custom hooks for customer operations
 * Uses tRPC for type-safe customer management with inferred types
 */

'use client';

import type { inferRouterInputs } from '@trpc/server';

import { trpc } from '@/lib/trpc/client';
import type { AppRouter } from '@/lib/trpc/router';
import type { ExportType } from '@/lib/trpc/schemas/customers';
import type { CustomerStatus } from '@/lib/types';
import { downloadFile } from '@/lib/utils';

import { useToast } from '@/hooks/use-toast';

type RouterInput = inferRouterInputs<AppRouter>;
type CreateCustomerInput = RouterInput['customers']['create'];
type UpdateCustomerInput = RouterInput['customers']['update'];
type CustomerListFilters = RouterInput['customers']['list'];
type DeleteCustomerInput = RouterInput['customers']['delete'];

/**
 * Hook for customer list operations (queries)
 */
export function useCustomersList(filters: CustomerListFilters) {
  const {
    data: customersData,
    isLoading,
    error,
  } = trpc.customers.list.useQuery(filters, {
    staleTime: 1000 * 60 * 2, // 2 minutes
    placeholderData: (previousData) => previousData,
    enabled: !!filters?.organizationId,
  });

  return {
    customers: customersData?.customers ?? [],
    total: customersData?.total ?? 0,
    page: customersData?.page ?? 1,
    limit: customersData?.limit ?? 10,
    totalPages: customersData?.totalPages ?? 0,
    isLoading,
    error,
  };
}

/**
 * Hook for a single kanban column: customers of one status, loaded page by page
 */
export function useCustomersBoardColumn({
  organizationId,
  status,
  searchQuery,
  pageSize = 20,
}: {
  organizationId: string;
  status: CustomerStatus;
  searchQuery?: string;
  pageSize?: number;
}) {
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    trpc.customers.list.useInfiniteQuery(
      {
        organizationId,
        statuses: [status],
        searchQuery,
        limit: pageSize,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      },
      {
        staleTime: 1000 * 60 * 2, // 2 minutes
        enabled: !!organizationId,
        getNextPageParam: (lastPage) =>
          lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
      }
    );

  return {
    customers: data?.pages.flatMap((p) => p.customers) ?? [],
    total: data?.pages[0]?.total ?? 0,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  };
}

/**
 * Hook for dealership pipeline metrics
 */
export function useCustomerStats(organizationId: string | undefined) {
  const { data: stats, isLoading } = trpc.customers.stats.useQuery(
    { organizationId: organizationId ?? '' },
    {
      staleTime: 1000 * 60 * 2, // 2 minutes
      enabled: !!organizationId,
    }
  );

  return { stats, isLoading };
}

/**
 * Hook for customer mutations (create, update, delete, export)
 */
export function useCustomerActions() {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const createCustomer = trpc.customers.create.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Customer created successfully',
      });
      utils.customers.list.invalidate();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create customer',
        variant: 'destructive',
      });
    },
  });

  const updateCustomer = trpc.customers.update.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Customer updated successfully',
      });
      return utils.customers.list.invalidate();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update customer',
        variant: 'destructive',
      });
    },
  });

  const deleteCustomer = trpc.customers.delete.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Customer deleted successfully',
      });
      utils.customers.list.invalidate();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete customer',
        variant: 'destructive',
      });
    },
  });

  const exportCustomers = trpc.customers.export.useMutation({
    onSuccess: (data, variables) => {
      downloadFile(data.data, data.filename);

      toast({
        title: 'Success',
        description: `Customers exported as ${variables.type.toUpperCase()}`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to export customers',
        variant: 'destructive',
      });
    },
  });

  return {
    createCustomer: (input: CreateCustomerInput) => createCustomer.mutateAsync(input),
    updateCustomer: (input: UpdateCustomerInput) => updateCustomer.mutateAsync(input),
    deleteCustomer: (input: DeleteCustomerInput) => deleteCustomer.mutateAsync(input),
    exportCustomers: ({ type, organizationId }: { type: ExportType; organizationId: string }) =>
      exportCustomers.mutateAsync({ type, organizationId }),
    isCreating: createCustomer.isPending,
    isUpdating: updateCustomer.isPending,
    isDeleting: deleteCustomer.isPending,
    isExporting: exportCustomers.isPending,
  };
}
