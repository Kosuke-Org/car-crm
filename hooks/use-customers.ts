/**
 * Custom hooks for customer operations
 * Uses tRPC for type-safe customer management with inferred types
 */

'use client';

import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

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
type CustomerListItem = inferRouterOutputs<AppRouter>['customers']['list']['customers'][number];

const BOARD_COLUMN_PAGE_SIZE = 20;

/**
 * Query input for one board column. Shared by the column query and the optimistic
 * move so both address the same cache entry.
 */
function getBoardColumnInput(params: {
  organizationId: string;
  status: CustomerStatus;
  searchQuery?: string;
}) {
  return {
    organizationId: params.organizationId,
    statuses: [params.status],
    searchQuery: params.searchQuery,
    limit: BOARD_COLUMN_PAGE_SIZE,
    sortBy: 'createdAt' as const,
    sortOrder: 'desc' as const,
  };
}

/**
 * Hook for customer list operations (queries)
 */
export function useCustomersList(filters: CustomerListFilters, options?: { enabled?: boolean }) {
  const {
    data: customersData,
    isLoading,
    error,
  } = trpc.customers.list.useQuery(filters, {
    staleTime: 1000 * 60 * 2, // 2 minutes
    placeholderData: (previousData) => previousData,
    enabled: !!filters?.organizationId && (options?.enabled ?? true),
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
 * Hook for one status column of the customer board (paged with "load more")
 */
export function useCustomerBoardColumn(params: {
  organizationId: string;
  status: CustomerStatus;
  searchQuery?: string;
}) {
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    trpc.customers.list.useInfiniteQuery(getBoardColumnInput(params), {
      staleTime: 1000 * 60 * 2, // 2 minutes
      placeholderData: (previousData) => previousData,
      enabled: !!params.organizationId,
      initialCursor: 1,
      getNextPageParam: (lastPage) =>
        lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    });

  const pages = data?.pages ?? [];
  // Offset pages can overlap while customers move between columns; keep each card once
  const customers = [...new Map(pages.flatMap((p) => p.customers).map((c) => [c.id, c])).values()];

  return {
    customers,
    total: pages[0]?.total ?? 0,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage: () => fetchNextPage(),
  };
}

/**
 * Hook for moving a customer between board columns. Updates both columns
 * optimistically and rolls back if the server rejects the change.
 */
export function useMoveCustomer(params: { organizationId: string; searchQuery?: string }) {
  const { organizationId, searchQuery } = params;
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const updateCustomer = trpc.customers.update.useMutation();

  const moveCustomer = async ({
    customer,
    status,
  }: {
    customer: CustomerListItem;
    status: CustomerStatus;
  }) => {
    if (customer.status === status) return;

    const fromInput = getBoardColumnInput({
      organizationId,
      status: customer.status,
      searchQuery,
    });
    const toInput = getBoardColumnInput({ organizationId, status, searchQuery });

    await utils.customers.list.cancel();
    const previousFrom = utils.customers.list.getInfiniteData(fromInput);
    const previousTo = utils.customers.list.getInfiniteData(toInput);

    utils.customers.list.setInfiniteData(fromInput, (data) =>
      data
        ? {
            ...data,
            pages: data.pages.map((p) => ({
              ...p,
              customers: p.customers.filter((c) => c.id !== customer.id),
              total: Math.max(p.total - 1, 0),
            })),
          }
        : data
    );
    utils.customers.list.setInfiniteData(toInput, (data) =>
      data
        ? {
            ...data,
            pages: data.pages.map((p, index) => ({
              ...p,
              customers: index === 0 ? [{ ...customer, status }, ...p.customers] : p.customers,
              total: p.total + 1,
            })),
          }
        : data
    );

    try {
      await updateCustomer.mutateAsync({ id: customer.id, organizationId, status });
      toast({
        title: 'Customer moved',
        description: `${customer.firstName} ${customer.lastName} is now ${status}`,
      });
    } catch (error) {
      utils.customers.list.setInfiniteData(fromInput, previousFrom);
      utils.customers.list.setInfiniteData(toInput, previousTo);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to move customer',
        variant: 'destructive',
      });
    } finally {
      utils.customers.list.invalidate();
      utils.customers.stats.invalidate();
      utils.customers.get.invalidate({ id: customer.id, organizationId });
    }
  };

  return { moveCustomer };
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
      utils.customers.list.invalidate();
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
