/**
 * Custom hooks for customer operations
 * Uses tRPC for type-safe customer management with inferred types
 */

'use client';

import { useRef } from 'react';

import { type Mutation, type Query, useMutationState, useQueryClient } from '@tanstack/react-query';
import { getMutationKey, getQueryKey } from '@trpc/react-query';
import type { inferRouterInputs } from '@trpc/server';

import { trpc } from '@/lib/trpc/client';
import type { AppRouter } from '@/lib/trpc/router';
import type { ExportType } from '@/lib/trpc/schemas/customers';
import type { CustomerStatus, CustomerWithDetails } from '@/lib/types';
import { downloadFile } from '@/lib/utils';

import { useToast } from '@/hooks/use-toast';

type RouterInput = inferRouterInputs<AppRouter>;
type CreateCustomerInput = RouterInput['customers']['create'];
type UpdateCustomerInput = RouterInput['customers']['update'];
type CustomerListFilters = RouterInput['customers']['list'];
type DeleteCustomerInput = RouterInput['customers']['delete'];

const BOARD_COLUMN_PAGE_SIZE = 20;

// Shared by every customers.update in the app (board moves and the edit dialog), so pending
// updates can be read from the QueryClient's mutation cache, which outlives the board
const updateCustomerMutationKey = getMutationKey(trpc.customers.update);

function getUpdatedCustomerId(mutation: Mutation) {
  return (mutation.state.variables as Partial<UpdateCustomerInput> | undefined)?.id;
}

function getListStatuses(query: Pick<Query, 'queryKey'>) {
  const [, keyParams] = query.queryKey as [unknown, { input?: CustomerListFilters }?];
  return keyParams?.input?.statuses;
}

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
  const {
    data,
    isLoading,
    isFetching,
    isError,
    isLoadingError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
  } = trpc.customers.list.useInfiniteQuery(getBoardColumnInput(params), {
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
    isFetching,
    // A request failed after retries. With isLoadingError no page ever arrived, so
    // `customers` and `total` are unknown; otherwise the last loaded pages stay usable.
    isError,
    isLoadingError,
    hasNextPage,
    isFetchingNextPage,
    // Never cancel a running refetch: the next page would build on the optimistic first page
    fetchNextPage: () => fetchNextPage({ cancelRefetch: false }),
    refetch: () => refetch(),
  };
}

/**
 * Hook for moving a customer between board columns. Updates both columns
 * optimistically and rolls back if the server rejects the change.
 * A customer cannot move while any update of it is pending (a move or an edit, from
 * this board or one unmounted since), because the update has no version check and
 * an older request could finish last.
 */
export function useMoveCustomer(params: { organizationId: string; searchQuery?: string }) {
  const { organizationId, searchQuery } = params;
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const queryClient = useQueryClient();
  const updateCustomer = trpc.customers.update.useMutation();
  // A move reaches the mutation cache only after the column cancels settle;
  // the ref blocks a second move of the same customer before then
  const movingIdsRef = useRef(new Set<CustomerWithDetails['id']>());
  const pendingUpdateIds = useMutationState({
    filters: { mutationKey: updateCustomerMutationKey, status: 'pending' },
    select: getUpdatedCustomerId,
  });
  const movingCustomerIds: ReadonlySet<CustomerWithDetails['id']> = new Set(
    pendingUpdateIds.filter((id) => id !== undefined)
  );

  const hasPendingUpdate = (id: CustomerWithDetails['id']) =>
    movingIdsRef.current.has(id) ||
    queryClient.isMutating({
      mutationKey: updateCustomerMutationKey,
      predicate: (mutation) => getUpdatedCustomerId(mutation) === id,
    }) > 0;

  const moveCustomer = async ({
    customer,
    status,
  }: {
    customer: CustomerWithDetails;
    status: CustomerStatus;
  }) => {
    if (customer.status === status || hasPendingUpdate(customer.id)) return;

    movingIdsRef.current.add(customer.id);

    const fromInput = getBoardColumnInput({
      organizationId,
      status: customer.status,
      searchQuery,
    });
    const toInput = getBoardColumnInput({ organizationId, status, searchQuery });

    await Promise.all([
      utils.customers.list.cancel(fromInput),
      utils.customers.list.cancel(toInput),
    ]);
    const previousFrom = utils.customers.list.getInfiniteData(fromInput);
    const previousTo = utils.customers.list.getInfiniteData(toInput);

    try {
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
      utils.customers.list.setInfiniteData(toInput, (data) => {
        if (!data) return data;
        // Columns sort by createdAt desc: the card goes before the first older loaded card
        const createdAt = customer.createdAt.getTime();
        const isOlder = (c: CustomerWithDetails) => c.createdAt.getTime() < createdAt;
        let targetPage = data.pages.findIndex((p) => p.customers.some(isOlder));
        const lastPage = data.pages.at(-1);
        // Older than every loaded card: it goes at the end only when the column is fully
        // loaded and its last page has room; otherwise its server position is on a page
        // not loaded yet, and only the total changes
        if (
          targetPage === -1 &&
          lastPage &&
          lastPage.page >= lastPage.totalPages &&
          lastPage.customers.length < lastPage.limit
        ) {
          targetPage = data.pages.length - 1;
        }
        return {
          ...data,
          pages: data.pages.map((p, index) => {
            if (index !== targetPage) return { ...p, total: p.total + 1 };
            const position = p.customers.findIndex(isOlder);
            const customers = [...p.customers];
            customers.splice(position === -1 ? customers.length : position, 0, {
              ...customer,
              status,
            });
            return { ...p, customers, total: p.total + 1 };
          }),
        };
      });

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
      movingIdsRef.current.delete(customer.id);
      // The lists that can hold the customer: its old or new column under any search, and
      // any table whose status filter is empty or includes either status
      const movedStatuses = [customer.status, status];
      const canHoldCustomer = (query: Pick<Query, 'queryKey'>) => {
        const statuses = getListStatuses(query);
        return !statuses?.length || movedStatuses.some((s) => statuses.includes(s));
      };
      // A refetch joins a first load still running instead of restarting it, and that load
      // may have read the customer before the write. Cancelling it reverts the query to its
      // unloaded state (no error), so the refetch below starts a new load.
      await queryClient.cancelQueries({
        queryKey: getQueryKey(trpc.customers.list, { organizationId }),
        fetchStatus: 'fetching',
        predicate: (query) => query.state.data === undefined && canHoldCustomer(query),
      });
      // Mark every list stale, then refetch the ones on screen that can hold the customer.
      // A fetch already running on one of those restarts, as it may have read the customer
      // before the write; columns of other statuses keep theirs.
      utils.customers.list.invalidate(undefined, { refetchType: 'none' });
      utils.customers.list.invalidate({ organizationId }, { predicate: canHoldCustomer });
      utils.customers.stats.invalidate();
      utils.customers.get.invalidate({ id: customer.id, organizationId });
    }
  };

  return { moveCustomer, movingCustomerIds };
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
