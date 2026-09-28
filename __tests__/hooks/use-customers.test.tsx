/**
 * Tests for the customer board hooks in use-customers
 */
import { act, renderHook } from '@testing-library/react';
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
      },
    },
    useUtils: () => mockUtils,
  },
}));

const organizationId = '22222222-2222-4222-8222-222222222222';

function makeCustomer(id: string, status: 'lead' | 'prospect' | 'active' | 'inactive') {
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
    createdAt: new Date('2026-01-01'),
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
});

describe('useMoveCustomer', () => {
  const customer = makeCustomer('a', 'lead');
  let mutateAsync: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mutateAsync = vi.fn().mockResolvedValue({ ...customer, status: 'prospect' });
    (trpc.customers.update.useMutation as Mock).mockReturnValue({ mutateAsync });
  });

  it('does nothing when the customer is dropped on its own column', async () => {
    const { result } = renderHook(() => useMoveCustomer({ organizationId }));

    await act(() => result.current.moveCustomer({ customer, status: 'lead' }));

    expect(mutateAsync).not.toHaveBeenCalled();
    expect(mockUtils.customers.list.setInfiniteData).not.toHaveBeenCalled();
  });

  it('moves the card between both column caches and saves only the status', async () => {
    const { result } = renderHook(() => useMoveCustomer({ organizationId, searchQuery: 'jane' }));

    await act(() => result.current.moveCustomer({ customer, status: 'prospect' }));

    expect(mutateAsync).toHaveBeenCalledWith({ id: 'a', organizationId, status: 'prospect' });

    const [[fromInput, removeFromSource], [toInput, addToTarget]] =
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

    const existing = makeCustomer('c', 'prospect');
    const target = addToTarget({
      pages: [makePage([existing], { total: 1 }), makePage([], { page: 2, total: 1 })],
      pageParams: [1, 2],
    });
    expect(target.pages[0].customers[0]).toEqual({ ...customer, status: 'prospect' });
    expect(target.pages[0].customers).toHaveLength(2);
    expect(target.pages[1].customers).toHaveLength(0);
    expect(target.pages.every((p: { total: number }) => p.total === 2)).toBe(true);

    expect(mockUtils.customers.list.invalidate).toHaveBeenCalled();
    expect(mockUtils.customers.stats.invalidate).toHaveBeenCalled();
    expect(mockUtils.customers.get.invalidate).toHaveBeenCalledWith({ id: 'a', organizationId });
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Customer moved' }));
  });

  it('restores both columns and shows an error when the save fails', async () => {
    const previousFrom = { pages: [makePage([customer])], pageParams: [1] };
    const previousTo = { pages: [makePage([])], pageParams: [1] };
    mockUtils.customers.list.getInfiniteData
      .mockReturnValueOnce(previousFrom)
      .mockReturnValueOnce(previousTo);
    mutateAsync.mockRejectedValue(new Error('Customer not found'));

    const { result } = renderHook(() => useMoveCustomer({ organizationId }));

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
