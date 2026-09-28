/**
 * Tests for the customer board hooks in use-customers
 */
import type { ReactNode } from 'react';

import { QueryClient, QueryClientProvider, useMutation } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { type Mock, vi } from 'vitest';

import { trpc } from '@/lib/trpc/client';

import { useCustomerBoardColumn, useMoveCustomer } from '@/hooks/use-customers';

const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
    dismiss: vi.fn(),
  }),
}));

const mockUtils = {
  customers: {
    list: {
      cancel: vi.fn(),
      invalidate: vi.fn(),
      getInfiniteData: vi.fn(),
      setInfiniteData: vi.fn(),
    },
    stats: { invalidate: vi.fn() },
    get: { invalidate: vi.fn() },
  },
};

vi.mock('@/lib/trpc/client', () => ({
  trpc: {
    customers: {
      list: {
        useInfiniteQuery: vi.fn(),
      },
      update: {
        useMutation: vi.fn(),
        // Read by getMutationKey, as on the real tRPC proxy
        _def: () => ({ path: ['customers', 'update'] }),
      },
    },
    useUtils: () => mockUtils,
  },
}));

const organizationId = '22222222-2222-4222-8222-222222222222';

// The mutation key tRPC gives every customers.update
const updateMutationKey = [['customers', 'update']];

function makeCustomer(
  id: string,
  status: 'lead' | 'prospect' | 'active' | 'inactive',
  createdAt = '2026-01-01'
) {
  return {
    id,
    firstName: 'Jane',
    lastName: `Doe ${id}`,
    email: `${id}@example.com`,
    phone: null,
    city: null,
    status,
    interestedInModel: 'Model Y',
    notes: null,
    lastContactedAt: null,
    createdAt: new Date(createdAt),
    updatedAt: new Date('2026-01-01'),
    userDisplayName: 'Rep',
    userEmail: 'rep@example.com',
  };
}

function makePage(
  customers: ReturnType<typeof makeCustomer>[],
  { page = 1, total = customers.length, totalPages = 1 } = {}
) {
  return { customers, total, page, limit: 20, totalPages };
}

const boardInput = (status: string, searchQuery?: string) => ({
  organizationId,
  statuses: [status],
  searchQuery,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc',
});

describe('useCustomerBoardColumn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('queries one status with the board page size and pages by cursor', () => {
    (trpc.customers.list.useInfiniteQuery as Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
    });

    renderHook(() =>
      useCustomerBoardColumn({ organizationId, status: 'lead', searchQuery: 'tesla' })
    );

    const [input, options] = (trpc.customers.list.useInfiniteQuery as Mock).mock.calls[0];
    expect(input).toEqual(boardInput('lead', 'tesla'));
    expect(options.enabled).toBe(true);
    expect(options.initialCursor).toBe(1);
    expect(options.getNextPageParam(makePage([], { page: 1, totalPages: 3 }))).toBe(2);
    expect(options.getNextPageParam(makePage([], { page: 3, totalPages: 3 }))).toBeUndefined();
  });

  it('is disabled until the organization is known', () => {
    (trpc.customers.list.useInfiniteQuery as Mock).mockReturnValue({ data: undefined });

    renderHook(() => useCustomerBoardColumn({ organizationId: '', status: 'lead' }));

    const [, options] = (trpc.customers.list.useInfiniteQuery as Mock).mock.calls[0];
    expect(options.enabled).toBe(false);
  });

  it('flattens loaded pages, drops duplicate cards and reports the column total', () => {
    const a = makeCustomer('a', 'lead');
    const b = makeCustomer('b', 'lead');
    const c = makeCustomer('c', 'lead');
    (trpc.customers.list.useInfiniteQuery as Mock).mockReturnValue({
      data: {
        pages: [
          makePage([a, b], { page: 1, total: 41, totalPages: 3 }),
          // Offset pages overlap after a card leaves the column
          makePage([b, c], { page: 2, total: 41, totalPages: 3 }),
        ],
      },
      isLoading: false,
      hasNextPage: true,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
    });

    const { result } = renderHook(() => useCustomerBoardColumn({ organizationId, status: 'lead' }));

    expect(result.current.customers.map((customer) => customer.id)).toEqual(['a', 'b', 'c']);
    expect(result.current.total).toBe(41);
    expect(result.current.hasNextPage).toBe(true);
  });

  it('reports any fetch and loads the next page without cancelling a running refetch', () => {
    const fetchNextPage = vi.fn();
    (trpc.customers.list.useInfiniteQuery as Mock).mockReturnValue({
      data: { pages: [makePage([], { total: 25, totalPages: 2 })] },
      isLoading: false,
      isFetching: true,
      hasNextPage: true,
      isFetchingNextPage: false,
      fetchNextPage,
    });

    const { result } = renderHook(() => useCustomerBoardColumn({ organizationId, status: 'lead' }));

    expect(result.current.isFetching).toBe(true);
    result.current.fetchNextPage();
    expect(fetchNextPage).toHaveBeenCalledWith({ cancelRefetch: false });
  });

  it('reports a column that never loaded and retries it', () => {
    const refetch = vi.fn();
    (trpc.customers.list.useInfiniteQuery as Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: true,
      isLoadingError: true,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
      refetch,
    });

    const { result } = renderHook(() => useCustomerBoardColumn({ organizationId, status: 'lead' }));

    expect(result.current.isError).toBe(true);
    expect(result.current.isLoadingError).toBe(true);
    expect(result.current.customers).toEqual([]);

    // Called as a click handler: the event must not reach refetch as its options
    (result.current.refetch as (...args: unknown[]) => unknown)({ type: 'click' });
    expect(refetch).toHaveBeenCalledTimes(1);
    expect(refetch).toHaveBeenCalledWith();
  });

  it('keeps the loaded cards and total when a later request fails', () => {
    const a = makeCustomer('a', 'lead');
    (trpc.customers.list.useInfiniteQuery as Mock).mockReturnValue({
      data: { pages: [makePage([a], { total: 21, totalPages: 2 })] },
      isLoading: false,
      isFetching: false,
      isError: true,
      isLoadingError: false,
      hasNextPage: true,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useCustomerBoardColumn({ organizationId, status: 'lead' }));

    expect(result.current.isError).toBe(true);
    expect(result.current.isLoadingError).toBe(false);
    expect(result.current.customers.map((customer) => customer.id)).toEqual(['a']);
    expect(result.current.total).toBe(21);
  });
});

describe('useMoveCustomer', () => {
  const customer = makeCustomer('a', 'lead');
  // Stands in for the customers.update request
  let updateRequest: Mock;
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient();
    updateRequest = vi.fn().mockResolvedValue({ ...customer, status: 'prospect' });
    // A real mutation under tRPC's key, so pending updates land in the mutation cache
    (trpc.customers.update.useMutation as Mock).mockImplementation(() =>
      useMutation({
        mutationKey: updateMutationKey,
        mutationFn: (input: unknown) => updateRequest(input),
      })
    );
  });

  it('does nothing when the customer is dropped on its own column', async () => {
    const { result } = renderHook(() => useMoveCustomer({ organizationId }), { wrapper });

    await act(() => result.current.moveCustomer({ customer, status: 'lead' }));

    expect(updateRequest).not.toHaveBeenCalled();
    expect(mockUtils.customers.list.setInfiniteData).not.toHaveBeenCalled();
  });

  it('moves the card between both column caches and saves only the status', async () => {
    const { result } = renderHook(() => useMoveCustomer({ organizationId, searchQuery: 'jane' }), {
      wrapper,
    });

    await act(() => result.current.moveCustomer({ customer, status: 'prospect' }));

    expect(updateRequest).toHaveBeenCalledWith({ id: 'a', organizationId, status: 'prospect' });

    const [[fromInput, removeFromSource], [toInput]] =
      mockUtils.customers.list.setInfiniteData.mock.calls;
    expect(fromInput).toEqual(boardInput('lead', 'jane'));
    expect(toInput).toEqual(boardInput('prospect', 'jane'));

    const other = makeCustomer('b', 'lead');
    const source = removeFromSource({
      pages: [makePage([customer, other], { total: 2 })],
      pageParams: [1],
    });
    expect(source.pages[0].customers.map((c: { id: string }) => c.id)).toEqual(['b']);
    expect(source.pages[0].total).toBe(1);

    expect(mockUtils.customers.stats.invalidate).toHaveBeenCalled();
    expect(mockUtils.customers.get.invalidate).toHaveBeenCalledWith({ id: 'a', organizationId });
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Customer moved' }));
  });

  describe('placing the card in the target column (createdAt desc)', () => {
    const moved = makeCustomer('a', 'lead', '2026-02-15');

    async function getTargetUpdater() {
      const { result } = renderHook(() => useMoveCustomer({ organizationId }), { wrapper });
      await act(() => result.current.moveCustomer({ customer: moved, status: 'prospect' }));
      return mockUtils.customers.list.setInfiniteData.mock.calls[1][1];
    }

    const ids = (page: { customers: { id: string }[] }) => page.customers.map((c) => c.id);

    it('inserts the card before the first older loaded card', async () => {
      const addToTarget = await getTargetUpdater();
      const target = addToTarget({
        pages: [
          makePage(
            [
              makeCustomer('new', 'prospect', '2026-03-01'),
              makeCustomer('old', 'prospect', '2026-01-01'),
            ],
            { total: 2 }
          ),
        ],
        pageParams: [1],
      });

      expect(ids(target.pages[0])).toEqual(['new', 'a', 'old']);
      expect(target.pages[0].customers[1]).toEqual({ ...moved, status: 'prospect' });
      expect(target.pages[0].total).toBe(3);
    });

    it('inserts into a later loaded page when that is where the card sorts', async () => {
      const addToTarget = await getTargetUpdater();
      const target = addToTarget({
        pages: [
          makePage([makeCustomer('p1', 'prospect', '2026-03-01')], { total: 30, totalPages: 2 }),
          makePage([makeCustomer('p2', 'prospect', '2026-01-01')], {
            page: 2,
            total: 30,
            totalPages: 2,
          }),
        ],
        pageParams: [1, 2],
      });

      expect(ids(target.pages[0])).toEqual(['p1']);
      expect(ids(target.pages[1])).toEqual(['a', 'p2']);
      expect(target.pages.every((p: { total: number }) => p.total === 31)).toBe(true);
    });

    it('appends the card when it is the oldest and the column is fully loaded', async () => {
      const addToTarget = await getTargetUpdater();
      const target = addToTarget({
        pages: [makePage([makeCustomer('new', 'prospect', '2026-03-01')], { total: 1 })],
        pageParams: [1],
      });

      expect(ids(target.pages[0])).toEqual(['new', 'a']);
    });

    it('adds the card to an empty column', async () => {
      const addToTarget = await getTargetUpdater();
      const target = addToTarget({
        pages: [makePage([], { total: 0, totalPages: 0 })],
        pageParams: [1],
      });

      expect(ids(target.pages[0])).toEqual(['a']);
      expect(target.pages[0].total).toBe(1);
    });

    it('only raises the total when the card sorts after the loaded cards and more pages remain', async () => {
      const addToTarget = await getTargetUpdater();
      const target = addToTarget({
        pages: [
          makePage([makeCustomer('new', 'prospect', '2026-03-01')], { total: 21, totalPages: 2 }),
        ],
        pageParams: [1],
      });

      expect(ids(target.pages[0])).toEqual(['new']);
      expect(target.pages[0].total).toBe(22);
    });

    it('only raises the total when the card is the oldest and the loaded last page is full', async () => {
      const addToTarget = await getTargetUpdater();
      const fullPage = Array.from({ length: 20 }, (_, i) =>
        makeCustomer(`p${i}`, 'prospect', '2026-03-01')
      );
      const target = addToTarget({
        pages: [makePage(fullPage, { total: 20, totalPages: 1 })],
        pageParams: [1],
      });

      expect(target.pages[0].customers).toHaveLength(20);
      expect(ids(target.pages[0])).not.toContain('a');
      expect(target.pages[0].total).toBe(21);
    });
  });

  it('cancels only the two columns it changes', async () => {
    const { result } = renderHook(() => useMoveCustomer({ organizationId, searchQuery: 'jane' }), {
      wrapper,
    });

    await act(() => result.current.moveCustomer({ customer, status: 'prospect' }));

    const { cancel } = mockUtils.customers.list;
    expect(cancel).toHaveBeenCalledTimes(2);
    expect(cancel).toHaveBeenCalledWith(boardInput('lead', 'jane'));
    expect(cancel).toHaveBeenCalledWith(boardInput('prospect', 'jane'));
  });

  it('refetches every list on screen that can hold the customer, under any search', async () => {
    const { result } = renderHook(() => useMoveCustomer({ organizationId, searchQuery: 'jane' }), {
      wrapper,
    });

    await act(() => result.current.moveCustomer({ customer, status: 'prospect' }));

    const { invalidate } = mockUtils.customers.list;
    expect(invalidate).toHaveBeenCalledTimes(2);
    // Every other list is only marked stale
    expect(invalidate).toHaveBeenNthCalledWith(1, undefined, { refetchType: 'none' });
    const [input, filters, options] = invalidate.mock.calls[1];
    expect(input).toEqual({ organizationId });
    // Restart a fetch already running: it may have read the customer before the write
    expect(options?.cancelRefetch).not.toBe(false);

    // Apply the filters to tRPC-shaped keys, as utils.customers.list.invalidate does
    const listKey = (listInput: object, type: 'infinite' | 'query') => [
      ['customers', 'list'],
      { input: listInput, type },
    ];
    const keys = {
      leadJane: listKey(boardInput('lead', 'jane'), 'infinite'),
      prospectJane: listKey(boardInput('prospect', 'jane'), 'infinite'),
      // The search changed while the move was saving
      leadDoe: listKey(boardInput('lead', 'doe'), 'infinite'),
      prospectDoe: listKey(boardInput('prospect', 'doe'), 'infinite'),
      activeDoe: listKey(boardInput('active', 'doe'), 'infinite'),
      table: listKey({ organizationId, searchQuery: 'doe', page: 1, limit: 10 }, 'query'),
      tableNoFilter: listKey({ organizationId, statuses: [], page: 1, limit: 10 }, 'query'),
      tableWithTarget: listKey({ organizationId, statuses: ['active', 'prospect'] }, 'query'),
      tableOtherStatuses: listKey({ organizationId, statuses: ['active', 'inactive'] }, 'query'),
      otherOrganization: listKey(
        { ...boardInput('lead', 'jane'), organizationId: '33333333-3333-4333-8333-333333333333' },
        'infinite'
      ),
    };
    Object.values(keys).forEach((key) => queryClient.setQueryData(key, {}));

    const matched = queryClient
      .getQueryCache()
      .findAll({ ...filters, queryKey: [['customers', 'list'], { input }] })
      .map((query) => query.queryKey);

    expect(matched).toHaveLength(7);
    expect(matched).toEqual(
      expect.arrayContaining([
        keys.leadJane,
        keys.prospectJane,
        keys.leadDoe,
        keys.prospectDoe,
        keys.table,
        keys.tableNoFilter,
        keys.tableWithTarget,
      ])
    );
  });

  it('blocks another move of the same customer until the first one settles', async () => {
    let resolveFirst: (value: unknown) => void = () => {};
    updateRequest.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFirst = resolve;
        })
    );
    const other = makeCustomer('b', 'lead');
    const { result } = renderHook(() => useMoveCustomer({ organizationId }), { wrapper });

    let firstMove: Promise<void> = Promise.resolve();
    await act(async () => {
      firstMove = result.current.moveCustomer({ customer, status: 'prospect' });
      // Same tick, before the first move reaches the server
      await result.current.moveCustomer({ customer, status: 'active' });
    });

    await waitFor(() => expect(result.current.movingCustomerIds.has('a')).toBe(true));
    expect(updateRequest).toHaveBeenCalledTimes(1);

    // After the first request is sent, the card is still locked
    const movedCustomer = { ...customer, status: 'prospect' as const };
    await act(() => result.current.moveCustomer({ customer: movedCustomer, status: 'active' }));
    expect(updateRequest).toHaveBeenCalledTimes(1);

    // Other customers stay movable
    await act(() => result.current.moveCustomer({ customer: other, status: 'active' }));
    expect(updateRequest).toHaveBeenCalledTimes(2);
    expect(updateRequest).toHaveBeenLastCalledWith({ id: 'b', organizationId, status: 'active' });

    await act(async () => {
      resolveFirst({ ...customer, status: 'prospect' });
      await firstMove;
    });

    await waitFor(() => expect(result.current.movingCustomerIds.has('a')).toBe(false));
    await act(() => result.current.moveCustomer({ customer: movedCustomer, status: 'active' }));
    expect(updateRequest).toHaveBeenCalledTimes(3);
    expect(updateRequest).toHaveBeenLastCalledWith({ id: 'a', organizationId, status: 'active' });
  });

  it('keeps the customer locked when the board remounts while its move saves', async () => {
    let resolveFirst: (value: unknown) => void = () => {};
    updateRequest.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFirst = resolve;
        })
    );
    const other = makeCustomer('b', 'lead');
    const firstBoard = renderHook(() => useMoveCustomer({ organizationId }), { wrapper });

    let firstMove: Promise<void> = Promise.resolve();
    await act(async () => {
      firstMove = firstBoard.result.current.moveCustomer({ customer, status: 'prospect' });
    });
    await waitFor(() => expect(updateRequest).toHaveBeenCalledTimes(1));

    // Switching to the table and back mounts a new board
    firstBoard.unmount();
    const { result } = renderHook(() => useMoveCustomer({ organizationId }), { wrapper });
    expect(result.current.movingCustomerIds.has('a')).toBe(true);

    const movedCustomer = { ...customer, status: 'prospect' as const };
    await act(() => result.current.moveCustomer({ customer: movedCustomer, status: 'active' }));
    expect(updateRequest).toHaveBeenCalledTimes(1);

    // Other customers stay movable
    await act(() => result.current.moveCustomer({ customer: other, status: 'active' }));
    expect(updateRequest).toHaveBeenCalledTimes(2);

    await act(async () => {
      resolveFirst({ ...customer, status: 'prospect' });
      await firstMove;
    });

    await waitFor(() => expect(result.current.movingCustomerIds.has('a')).toBe(false));
    await act(() => result.current.moveCustomer({ customer: movedCustomer, status: 'active' }));
    expect(updateRequest).toHaveBeenCalledTimes(3);
    expect(updateRequest).toHaveBeenLastCalledWith({ id: 'a', organizationId, status: 'active' });
  });

  it('blocks a move while another update of the same customer is saving', async () => {
    // An edit dialog save, under the same tRPC key
    const edit = queryClient.getMutationCache().build(queryClient, {
      mutationKey: updateMutationKey,
      mutationFn: () => new Promise(() => {}),
    });
    void edit.execute({ id: 'a', organizationId, phone: '+1 555 0100' });

    const { result } = renderHook(() => useMoveCustomer({ organizationId }), { wrapper });
    expect(result.current.movingCustomerIds.has('a')).toBe(true);

    await act(() => result.current.moveCustomer({ customer, status: 'prospect' }));
    expect(updateRequest).not.toHaveBeenCalled();
    expect(mockUtils.customers.list.setInfiniteData).not.toHaveBeenCalled();
  });

  it('unlocks the customer when the save fails', async () => {
    updateRequest.mockRejectedValueOnce(new Error('Customer not found'));
    const { result } = renderHook(() => useMoveCustomer({ organizationId }), { wrapper });

    await act(() => result.current.moveCustomer({ customer, status: 'prospect' }));
    expect(result.current.movingCustomerIds.size).toBe(0);

    await act(() => result.current.moveCustomer({ customer, status: 'prospect' }));
    expect(updateRequest).toHaveBeenCalledTimes(2);
  });

  it('restores both columns and shows an error when the save fails', async () => {
    const previousFrom = { pages: [makePage([customer])], pageParams: [1] };
    const previousTo = { pages: [makePage([])], pageParams: [1] };
    mockUtils.customers.list.getInfiniteData
      .mockReturnValueOnce(previousFrom)
      .mockReturnValueOnce(previousTo);
    updateRequest.mockRejectedValue(new Error('Customer not found'));

    const { result } = renderHook(() => useMoveCustomer({ organizationId }), { wrapper });

    await act(() => result.current.moveCustomer({ customer, status: 'prospect' }));

    const calls = mockUtils.customers.list.setInfiniteData.mock.calls;
    expect(calls[2]).toEqual([boardInput('lead'), previousFrom]);
    expect(calls[3]).toEqual([boardInput('prospect'), previousTo]);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'Customer not found', variant: 'destructive' })
    );
    expect(mockUtils.customers.list.invalidate).toHaveBeenCalled();
  });
});
