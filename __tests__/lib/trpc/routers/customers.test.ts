import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockTRPCContext } from '@/__tests__/setup/mocks';

import { db } from '@/lib/db/drizzle';
import * as customerService from '@/lib/services/customer-service';
import { createCaller } from '@/lib/trpc/server';

vi.mock('@/lib/db/drizzle', () => ({
  db: {
    query: {
      orgMemberships: {
        findFirst: vi.fn(),
      },
    },
  },
}));

vi.mock('@/lib/services/customer-service', () => ({
  listCustomers: vi.fn(),
  getCustomerStats: vi.fn(),
  getCustomerById: vi.fn(),
  createCustomer: vi.fn(),
  updateCustomer: vi.fn(),
  deleteCustomer: vi.fn(),
  exportCustomers: vi.fn(),
}));

describe('Customers Router', () => {
  const userId = 'user_123';
  const organizationId = '22222222-2222-4222-8222-222222222222';

  const listResult = { customers: [], total: 0, page: 2, limit: 20, totalPages: 0 };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.query.orgMemberships.findFirst).mockResolvedValue({
      id: 'membership_1',
      organizationId,
      userId,
      role: 'member' as const,
      createdAt: new Date('2026-01-01'),
    });
    vi.mocked(customerService.listCustomers).mockResolvedValue(listResult);
  });

  describe('list', () => {
    it('uses the infinite-query cursor as the page for board columns', async () => {
      const caller = await createCaller(createMockTRPCContext({ userId }));

      await caller.customers.list({
        organizationId,
        statuses: ['lead'],
        limit: 20,
        cursor: 2,
      });

      expect(customerService.listCustomers).toHaveBeenCalledWith({
        organizationId,
        statuses: ['lead'],
        searchQuery: undefined,
        page: 2,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
    });

    it('falls back to the page number when no cursor is sent', async () => {
      const caller = await createCaller(createMockTRPCContext({ userId }));

      await caller.customers.list({ organizationId, page: 3, cursor: null });

      expect(customerService.listCustomers).toHaveBeenCalledWith(
        expect.objectContaining({ page: 3, limit: 10 })
      );
    });
  });
});
